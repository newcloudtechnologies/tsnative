/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2020
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

import { AbstractExpressionHandler } from "./expressionhandler";
import { Environment } from "@scope";
import { error, unwrapPointerType } from "@utils";
import * as ts from "typescript";
import llvm = require("llvm-node");

export class CastHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.AsExpression:
        const asExpression = expression as ts.AsExpression;
        const value = this.generator.handleExpression(asExpression.expression, env);

        const destinationType = this.generator.ts.checker.getTypeFromTypeNode(asExpression.type);

        if (!this.generator.types.union.isLLVMUnion(value.type)) {
          return this.generator.builder.createBitCast(value, destinationType.getLLVMType());
        }

        if (!destinationType.isObject() && !destinationType.isUnion()) {
          error(`Cast to non-object/union not supported; trying to cast
          '${this.generator.ts.checker.getTypeAtLocation(asExpression.expression).toString()}'
          to '${destinationType.toString()}'`);
        }

        const unionName = (unwrapPointerType(value.type) as llvm.StructType).name;
        if (!unionName) {
          error("Name required for UnionStruct");
        }

        const unionMeta = this.generator.meta.getUnionMeta(unionName);
        if (destinationType.isObject()) {
          const typeProps = destinationType.getProperties();
          const propNames = typeProps.map((symbol) => symbol.name);
          const objectType = destinationType.getLLVMType();
          const allocated = this.generator.gc.allocate(unwrapPointerType(objectType));

          for (let i = 0; i < propNames.length; ++i) {
            const valueIndex = unionMeta.propsMap.get(propNames[i]);
            if (typeof valueIndex === "undefined") {
              error(`Mapping not found for '${propNames[i]}'`);
            }

            const destinationPtr = this.generator.xbuilder.createSafeInBoundsGEP(allocated, [0, i]);
            const propValuePtr = this.generator.xbuilder.createSafeInBoundsGEP(value, [0, valueIndex]);
            const propValue = this.generator.builder.createLoad(propValuePtr);
            this.generator.xbuilder.createSafeStore(propValue, destinationPtr);
          }
          return allocated;
        } else {
          const destinationStructType = unwrapPointerType(destinationType.getLLVMType()) as llvm.StructType;
          const destinationUnionMeta = this.generator.meta.getUnionMeta(destinationStructType.name!);

          const allocated = this.generator.gc.allocate(destinationStructType);

          destinationUnionMeta.propsMap.forEach((index, name) => {
            const sourceIndex = unionMeta.propsMap.get(name);
            if (!sourceIndex) {
              error(`'${name}' not found in '${unionMeta.name}'`);
            }

            const destinationPtr = this.generator.xbuilder.createSafeInBoundsGEP(allocated, [0, index]);
            const propValuePtr = this.generator.xbuilder.createSafeInBoundsGEP(value, [0, sourceIndex]);
            const propValue = this.generator.builder.createLoad(propValuePtr);
            this.generator.xbuilder.createSafeStore(propValue, destinationPtr);
          });

          return allocated;
        }
      default:
        break;
    }

    if (this.next) {
      return this.next.handle(expression, env);
    }

    return;
  }
}

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
import * as ts from "typescript";
import { LLVMValue } from "../../llvm/value";
import { LLVMStructType } from "../../llvm/type";

export class CastHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): LLVMValue | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.AsExpression:
        const asExpression = expression as ts.AsExpression;
        const value = this.generator.handleExpression(asExpression.expression, env);

        const destinationType = this.generator.ts.checker.getTypeFromTypeNode(asExpression.type);

        if (!value.isUnion()) {
          return this.generator.builder.createBitCast(value, destinationType.getLLVMType());
        }

        if (!destinationType.isObject() && !destinationType.isUnion()) {
          throw new Error(`Cast to non-object/union not supported; trying to cast
          '${this.generator.ts.checker.getTypeAtLocation(asExpression.expression).toString()}'
          to '${destinationType.toString()}'`);
        }

        const unionName = (value.type.unwrapPointer() as LLVMStructType).name;
        if (!unionName) {
          throw new Error("Name required for UnionStruct");
        }

        const unionMeta = this.generator.meta.getUnionMeta(unionName);
        if (destinationType.isObject()) {
          const typeProps = destinationType.getProperties();
          const propNames = typeProps.map((symbol) => symbol.name);
          const objectType = destinationType.getLLVMType();
          const allocated = this.generator.gc.allocate(objectType.unwrapPointer());

          for (let i = 0; i < propNames.length; ++i) {
            const valueIndex = unionMeta.propsMap.get(propNames[i]);
            if (typeof valueIndex === "undefined") {
              throw new Error(`Mapping not found for '${propNames[i]}'`);
            }

            const destinationPtr = this.generator.builder.createSafeInBoundsGEP(allocated, [0, i]);
            const propValuePtr = this.generator.builder.createSafeInBoundsGEP(value, [0, valueIndex]);
            const propValue = this.generator.builder.createLoad(propValuePtr);
            this.generator.builder.createSafeStore(propValue, destinationPtr);
          }
          return allocated;
        } else {
          const destinationStructType = destinationType.getLLVMType().unwrapPointer() as LLVMStructType;
          const destinationUnionMeta = this.generator.meta.getUnionMeta(destinationStructType.name!);

          const allocated = this.generator.gc.allocate(destinationStructType);

          destinationUnionMeta.propsMap.forEach((index, name) => {
            const sourceIndex = unionMeta.propsMap.get(name);
            if (!sourceIndex) {
              throw new Error(`'${name}' not found in '${unionMeta.name}'`);
            }

            const destinationPtr = this.generator.builder.createSafeInBoundsGEP(allocated, [0, index]);
            const propValuePtr = this.generator.builder.createSafeInBoundsGEP(value, [0, sourceIndex]);
            const propValue = this.generator.builder.createLoad(propValuePtr);
            this.generator.builder.createSafeStore(propValue, destinationPtr);
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

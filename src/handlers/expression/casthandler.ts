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
import {
  checkIfObject,
  checkIfUnion,
  error,
  getObjectPropsLLVMTypes,
  getUnionStructType,
  isUnionLLVMValue,
  tryResolveGenericTypeIfNecessary,
  unwrapPointerType,
} from "@utils";
import * as ts from "typescript";
import llvm = require("llvm-node");

export class CastHandler extends AbstractExpressionHandler {
  handle(expression: ts.Expression, env?: Environment): llvm.Value | undefined {
    switch (expression.kind) {
      case ts.SyntaxKind.AsExpression:
        const asExpression = expression as ts.AsExpression;
        const union = this.generator.handleExpression(asExpression.expression, env);

        if (!isUnionLLVMValue(union)) {
          error("Non-union type cast not supported");
        }

        const destinationType = tryResolveGenericTypeIfNecessary(
          this.generator.checker.getTypeFromTypeNode(asExpression.type),
          this.generator
        );

        if (!checkIfObject(destinationType) && !checkIfUnion(destinationType)) {
          error(`Cast to non-object/union not supported; trying to cast
          '${this.generator.checker.typeToString(this.generator.checker.getTypeAtLocation(asExpression.expression))}'
          to '${this.generator.checker.typeToString(destinationType)}'`);
        }

        const unionName = (unwrapPointerType(union.type) as llvm.StructType).name;
        if (!unionName) {
          error("Name required for UnionStruct");
        }

        const unionMeta = this.generator.meta.getUnionMeta(unionName);
        if (!unionMeta) {
          error(`Union meta not found for '${unionName}'`);
        }

        if (checkIfObject(destinationType)) {
          const typeProps = this.generator.checker.getPropertiesOfType(destinationType);
          const propNames = typeProps.map((symbol) => symbol.name);
          const propTypes = getObjectPropsLLVMTypes(destinationType as ts.ObjectType, expression, this.generator);
          const destinationStructType = llvm.StructType.get(this.generator.context, propTypes);
          const allocated = this.generator.gc.allocate(destinationStructType);

          for (let i = 0; i < propNames.length; ++i) {
            const valueIndex = unionMeta.propsMap.get(propNames[i]);
            if (!valueIndex) {
              error(`Mapping not found for '${propNames[i]}'`);
            }

            const destinationPtr = this.generator.builder.createInBoundsGEP(allocated, [
              llvm.ConstantInt.get(this.generator.context, 0),
              llvm.ConstantInt.get(this.generator.context, i),
            ]);
            const valuePtr = this.generator.builder.createInBoundsGEP(union, [
              llvm.ConstantInt.get(this.generator.context, 0),
              llvm.ConstantInt.get(this.generator.context, valueIndex),
            ]);
            const value = this.generator.builder.createLoad(valuePtr);
            this.generator.xbuilder.createSafeStore(value, destinationPtr);
          }
          return allocated;
        } else {
          const destinationStructType = getUnionStructType(destinationType as ts.UnionType, expression, this.generator);
          const destinationUnionMeta = this.generator.meta.getUnionMeta(destinationStructType.name!);

          if (!destinationUnionMeta) {
            error(`Union meta not found for '${destinationStructType.name}'`);
          }

          const allocated = this.generator.gc.allocate(destinationStructType);

          destinationUnionMeta.propsMap.forEach((index, name) => {
            const sourceIndex = unionMeta.propsMap.get(name);
            if (!sourceIndex) {
              error(`'${name}' not found in '${unionMeta.name}'`);
            }

            const destinationPtr = this.generator.builder.createInBoundsGEP(allocated, [
              llvm.ConstantInt.get(this.generator.context, 0),
              llvm.ConstantInt.get(this.generator.context, index),
            ]);
            const valuePtr = this.generator.builder.createInBoundsGEP(union, [
              llvm.ConstantInt.get(this.generator.context, 0),
              llvm.ConstantInt.get(this.generator.context, sourceIndex),
            ]);
            const value = this.generator.builder.createLoad(valuePtr);
            this.generator.xbuilder.createSafeStore(value, destinationPtr);
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

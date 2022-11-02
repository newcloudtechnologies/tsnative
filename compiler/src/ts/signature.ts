/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { LLVMGenerator } from "../generator";
import { TSType } from "./type";
import * as ts from "typescript";
import { TSSymbol } from "../ts/symbol";

export class Signature {
  private readonly signature: ts.Signature;
  private readonly generator: LLVMGenerator;

  private constructor(signature: ts.Signature, generator: LLVMGenerator) {
    this.signature = signature;
    this.generator = generator;
  }

  static create(signature: ts.Signature, generator: LLVMGenerator) {
    return new Signature(signature, generator);
  }

  get parameters() {
    return this.getParameters();
  }

  getReturnType() {
    return this.generator.ts.checker.getReturnTypeOfSignature(this.signature);
  }

  getParameters() {
    return this.signature.getParameters().map((parameter) => TSSymbol.create(parameter, this.generator));
  }

  getDeclaredParameters() {
    return this.signature.getDeclaration().parameters;
  }

  getTypeParameters() {
    return this.signature.getTypeParameters();
  }

  getGenericsToActualMap(expression: ts.CallLikeExpression) {
    const typenameTypeMap = new Map<string, TSType>();

    const resolvedSignature = this.generator.ts.checker.getResolvedSignature(expression);
    const actualParameters = resolvedSignature.getParameters();
    const formalParameters = this.getParameters();

    function handleType(type: TSType, actualType: TSType, generator: LLVMGenerator) {
      if ((type.isSupported() && !type.isFunction() && !type.isArray()) || typenameTypeMap.has(type.toString())) {
        return;
      }

      if (actualType.isFunction()) {
        const callSignature = Signature.create(type.getCallSignatures()[0], generator);
        const actualCall = Signature.create(actualType.getCallSignatures()[0], generator);
        const parameterFormalParameters = callSignature.parameters;

        for (let k = 0; k < parameterFormalParameters.length; ++k) {
          const formalParameter = parameterFormalParameters[k];
          const formalParameterType = generator.ts.checker.getTypeOfSymbolAtLocation(formalParameter, expression);
          const formalParameterTypename = formalParameterType.originTypename();

          const actualParameter = actualCall.parameters[k];
          const actualParameterType = generator.ts.checker.getTypeOfSymbolAtLocation(actualParameter, expression);

          typenameTypeMap.set(formalParameterTypename, actualParameterType);
        }

        const formalReturnType = callSignature.getReturnType();
        const formalReturnTypename = formalReturnType.originTypename();

        const actualReturnType = actualCall.getReturnType();

        typenameTypeMap.set(formalReturnTypename, actualReturnType);
      } else if (type.isArray()) {
        const typeArgument = type.getTypeGenericArguments()[0];
        const actualTypeArgument = actualType.getTypeGenericArguments()[0];
        typenameTypeMap.set(typeArgument.originTypename(), actualTypeArgument);
      } else {
        typenameTypeMap.set(type.originTypename(), actualType);
      }
    }

    for (let i = 0; i < formalParameters.length; ++i) {
      const parameter = formalParameters[i];
      const type = this.generator.ts.checker.getTypeOfSymbolAtLocation(parameter, expression);

      if (type.isUnionOrIntersection()) {
        const actualType = this.generator.ts.checker.getTypeOfSymbolAtLocation(actualParameters[i], expression);
        if (!actualType.isUnionOrIntersection()) {
          throw new Error(`Expected actual type to be of UnionOrIntersection, got '${actualType.toString()}'`);
        }

        type.types.forEach((subtype, index) => {
          handleType(subtype, actualType.types[index], this.generator);
        });

        continue;
      }

      const actualType = this.generator.ts.checker.getTypeOfSymbolAtLocation(actualParameters[i], expression);
      handleType(type, actualType, this.generator);
    }

    const formalTypeParameters = this.signature.getTypeParameters();
    const formalTypeParametersNames =
      formalTypeParameters?.map((parameter) => TSType.create(parameter, this.generator.ts.checker).toString()) || [];

    const readyTypenames = Object.keys(typenameTypeMap);
    const difference = formalTypeParametersNames.filter((type) => !readyTypenames.includes(type));
    if (difference.length === 1 && !typenameTypeMap.get(difference[0])) {
      typenameTypeMap.set(difference[0], resolvedSignature.getReturnType());
    } else if (difference.length > 1) {
      console.log("Cannot map generic type arguments to template arguments.\nNot an external symbol?");
    }

    return typenameTypeMap;
  }

  toString() {
    return this.generator.ts.checker.unwrap().signatureToString(this.signature);
  }
}

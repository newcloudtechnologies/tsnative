/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { gcTest } from "./gc_test_fixture";

function checkFunctionDeclarations() {
    function noParamFnc() {
        let a = 10;
        a = 15
    }
    noParamFnc();

    function primitiveParamFnc(s: string) {
        s = "acababasd";
    }
    primitiveParamFnc("my str");

    function restParamFnc(s: string, ...strs: string[]) {
        strs[0] = s;
    }

    restParamFnc("a", "b", "c");

    function defaultParamFnc(b: boolean = true) {
        b = false;
    }
    defaultParamFnc();
    defaultParamFnc(false);

    let n = 10;
    function changePrimitiveEnvFunction() {
        n = 15;
    }
    changePrimitiveEnvFunction();

    class A {
        n: number = 10;
    }
    function nonPrimitiveParamFnc(a: A) {
        a.n = 15;
    }
    nonPrimitiveParamFnc(new A());

    function returnNonPrimitive(): A {
        return new A();
    }

    const aa = returnNonPrimitive();

    function returnFunction() {
        let a = 15;
        return function() {
            a = 25;
            return function() {
                return a;
            }
        }
    }

    let a25 = returnFunction()()();
    console.assert(a25 === 25, "GC Functions: a is alive check");

    function withVariableHoisting() {
        hoisted = 120;
    }

    let hoisted = 5;
    withVariableHoisting();
    console.assert(hoisted === 120, "GC Functions: hoisted is alive check");
}


function checkFunctionExpressions() {
    let noParamFnc = function() {
        let a = 10;
        a = 15
    }
    noParamFnc();

    let primitiveParamFnc = function(s: string) {
        s = "acababasd";
    }
    primitiveParamFnc("my str");

    let restParamFnc = function(s: string, ...strs: string[]) {
        strs[0] = s;
    }

    restParamFnc("a", "b", "c");

    let defaultParamFnc = function(b: boolean = true) {
        b = false;
    }
    defaultParamFnc();
    defaultParamFnc(false);

    let n = 10;
    let changePrimitiveEnvFunction = function() {
        n = 15;
    }
    changePrimitiveEnvFunction();

    class A {
        n: number = 10;
    }

    const nonPrimitiveParamFnc = (a: A) => {
        a.n = 15;
    }
    nonPrimitiveParamFnc(new A());

    const returnNonPrimitiveFunctionExpression = function() {
        return new A();
    }
    returnNonPrimitiveFunctionExpression();
}

function checkLambdas() {
    let voidVoidLambdaEmptyBody = () => {};
    voidVoidLambdaEmptyBody();

    let voidVoidLambdaWithBody = () => {
        let a = 10;
        a = 15;
    };
    voidVoidLambdaWithBody();

    let voidNumberLambdaWithBody = (n: number) => {
        n = 20;
        n += 35;
    }
    voidNumberLambdaWithBody(10);

    let returnInputLambda = (s: string) => {
        return s;
    }
    let ss = returnInputLambda("abcaba");
    ss = returnInputLambda(ss);

    let changeEnvironmentLambda = () => {
        ss = "my string";
    }
    changeEnvironmentLambda();

    class A {
        s: string;

        constructor(ss: string) {
            this.s = ss;
        }
    }

    let returnObjectLambdaWithCapturingEnv = () => {
        return new A(ss);
    }
    let aa = returnObjectLambdaWithCapturingEnv();

    let lambdaWithLambdaArg = (l: (n: number) => number) => {
        return l(10);
    }
    lambdaWithLambdaArg((n: number) => n);

    let lambdaReturningLambda = () => {
        let value = 20;
        return () => {
            let a = 15;
            a = 10;
            return value + a;
        }
    }
    let r = lambdaReturningLambda()();
    console.assert(r === 30, "GC lambda: checking r is alive");
}

function checkBinds() {
    function foo(n: number, s: string) {
        return n.toString() + s;
    }
    foo.bind(null, 1, "abacaba")();

    let lambda = (n: number, s: string) => {
        return n.toString() + s;
    }
    lambda.bind(null, 10, "my str")();

    class A {
        foo(n: number) {
            return n;
        }
    };

    let clazz = new A();
    clazz.foo.bind(clazz, 35)();
}

gcTest(checkFunctionDeclarations, "Check function declaration");
gcTest(checkFunctionExpressions, "Check function expressions");
gcTest(checkLambdas, "Check lambda");
gcTest(checkBinds, "Check bind");

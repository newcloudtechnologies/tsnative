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

function checkSimpleExceptions() {
    try {
        throw "abcaba";
    }
    catch (e) {

    }

    let a = 15;

    try {
        a = 10;

        throw "abcaba";
    }
    catch (e) {

    }

    try {
        let a = 10;
        a = 25;
    }
    catch (e) {

    }
}

function checkExceptionsFromFunctions() {
    function justThrow() {
        throw 10;
    }

    try {
        justThrow();
    }
    catch (e) {
        e = 15;
    }

    function tryCatchInside(): number {
        try {
            throw 10;
        }
        catch (e) {
            return e;
        }
    }

    const e1 = tryCatchInside();
    console.assert(e1 === 10, "GC exceptions: e1 alive check");

    // TODO https://jira.ncloudtech.ru:8090/browse/TSN-388
    // const throwCatchInsideLambda = () => {
    //     let a = 30;
    //     try {
    //         throw a;
    //     }
    //     catch (e) {
    //         return e as number;
    //     }
    // }
    // const numberError = throwCatchInsideLambda();
    // console.assert(numberError === 30, "GC exceptions: error alive check");

    class Clazz {
        foo() : string {
            try {
                throw "abacaba"
            }
            catch (e) {
                return e;
            }
        }
    }

    let c = new Clazz();
    const strError = c.foo();
    console.assert(strError === "abacaba", "GC exceptions: error alive check");

    // TODO https://jira.ncloudtech.ru:8090/browse/TSN-388
    // const arr = [1, 2, 3];
    // try {
    //     for (let a of arr) {
    //         if (a === 2) {
    //             throw a;
    //         }
    //     }
    // }
    // catch (e) {
    //     console.assert(e === 2, "GC exceptions: array element alive check");
    // }
}

function checkNestedExceptions() {
    try {
        try {
            let a = 15;
            throw "abacaba";
        }
        catch (e) {
            let variable = 100;
            console.assert(e === "abacaba", "Exceptions: thrown value equality check failed");
            throw e;
        }
    }
    catch(ee) {
        console.assert(ee === "abacaba", "Exceptions: thrown value equality check failed");
    }
}

gcTest(checkSimpleExceptions, "Check simple exceptions");
gcTest(checkExceptionsFromFunctions, "Check exceptions from functions");
gcTest(checkNestedExceptions, "Check nested exceptions from functions");
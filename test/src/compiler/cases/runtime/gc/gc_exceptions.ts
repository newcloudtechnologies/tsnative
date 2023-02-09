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

gcTest(checkSimpleExceptions, "Check simple exceptions");
gcTest(checkExceptionsFromFunctions, "Check exceptions from functions");
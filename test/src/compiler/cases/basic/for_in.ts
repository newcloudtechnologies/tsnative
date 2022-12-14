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

{
    // Simple string iteration
    {
        const s: String = "abacaba";
        let counter = 0;
        for (const i in s) {
            console.assert(counter.toString() === i, "For in: Simple string iteration counter check failed");
            ++counter;
        }
        console.assert(counter === s.length, "For in: Simple string iteration counter check failed");
    }

    // Empty string iteration
    {
        const s: String = "";
        let counter = 0;
        for (const i in s) {
            ++counter;
        }
        console.assert(counter === 0, "For in: Empty string iteration counter check failed");
    }

    // String iteration + continue
    {
        const s: String = "abcdefgh";
        let continueCounter = 0;
        let iterationsCounter = 0;
        for (const i in s) {
            ++iterationsCounter;
            if (continueCounter > 2) {
                continue;
            }
            ++continueCounter;
        }
        console.assert(iterationsCounter === s.length, "For in: String iteration + continue iterationsCounter check failed");
        console.assert(continueCounter === 3, "For in: String iteration + continue continueCounter check failed");
    }

    // String iteration + break
    {
        const s: String = "abcdefgh";
        let counter = 0;
        for (const i in s) {
            if (counter > 2) {
                break;
            }
            ++counter;
        }
        console.assert(counter === 3, "For in: String iteration + break counter check failed");
    }

    function makeSet(arr: string[]) {
        let result = new Set<string>();
        for (const v of arr) {
            result.add(v);
        }

        return result;
    }

    // Iterate over simple object
    {
        const obj = { name: 10, 5: 0 };
        let counter = 0;
        const expected = makeSet(["name", "5"]);

        for (const k in obj) {
            console.assert(expected.has(k), "For in: Iterate over simple object failed, key mismatch");
            ++counter;
        }

        console.assert(counter === expected.size, "For in: Iterate over simple object failed, iterations count error");
    }

    // Iterate over simple object + continue
    {
        const obj = { name: 10, 5: 0 };
        let continueCounter = 0;
        let iterationsCounter = 0;
        for (const i in obj) {
            ++iterationsCounter;
            if (continueCounter > 0) {
                continue;
            }
            ++continueCounter;
        }
        console.assert(iterationsCounter === 2, "For in: Iterate over simple object + continue iterationsCounter check failed");
        console.assert(continueCounter === 1, "For in: Iterate over simple object + continue continueCounter check failed");
    }

    // Iterate over simple object + break
    {
        const obj = { name: 10, 5: 0, id: "asdasda" };
        let counter = 0;
        for (const i in obj) {
            if (counter === 1) {
                break;
            }
            ++counter;
        }
        console.assert(counter === 1, "For in: Iterate over simple object + break counter check failed");
    }

    // Iterate over empty object
    {
        const obj = {};
        let counter = 0;
        for (const k in obj) {
            ++counter;
        }
        console.assert(counter === 0, "For in: Iterate over empty object failed");
    }

    // Iterate over object with nested object
    {
        const innerObject = { "innerKey": 1 };
        const obj = { innerObject: "outerValue" };
        const expected = makeSet(["innerObject"]);
        let counter = 0;
        for (const k in obj) {
            console.assert(expected.has(k), "For in: Iterate over object with nested object, key mismatch");
            ++counter;
        }
        console.assert(counter === expected.size, "For in: Iterate over simple object failed, iterations count error");
    }

    // Iterate over class + inheritance + shadowing
    {
        class Base {
            x: number = 0;
            y: string = "";
        };

        class Derived extends Base {
            x: number = 10; // Shadowing
            z: number = 100;
        };

        const d = new Derived();
        let counter = 0;
        const expected = makeSet(["x", "y", "z"]);
        for (const k in d) {
            console.assert(expected.has(k), "For in: Iterate over class + inheritance + shadowing, key mismatch");
            ++counter;
        }
        console.assert(counter === expected.size, "For in: Iterate over class + inheritance + shadowing, iterations count error");
    }

    // Iterate over class object
    {
        class A {
            private prop1: number = 0;
            protected prop2: number = 0;
            public prop3: number = 0;

            // TODO We add non static methods and non static getters to keys.
            // We should not do this, ts does not do this.

            // constructor() {}
            // private get getter1() { return 0; }
            // protected get getter2() { return 0; }
            // public get getter3() { return 0; }

            // private set setter1(a:number) {}
            // protected set setter2(a:number) {}
            // public set setter3(a:number) {}

            // private method1() {}
            // protected method2() {}
            // public method3() {}

            // private static staticMethod1() {}
            // protected static staticMethod2() {}
            // public static staticMethod3() {}

            // private static get staticGetter1() {}
            // protected static staticGetter2() {}
            // public static staticGetter3() {}
        };

        const a = new A();
        let counter = 0;
        const expected = makeSet(["prop1", "prop2", "prop3"]);

        for (const k in a) {
            console.assert(expected.has(k), "For in: Iterate over class object, key mismatch");
            ++counter;
        }
        console.assert(counter === expected.size, "For in: Iterate over class object, iterations count error");
    }

    // Iterate over simple array of numbers
    {
        const arr = [1, 2, 3];
        let counter = 0;

        for (const value in arr) {
            console.assert(counter.toString() === value, "For in: Iterate over simple array of numbers failed");
            ++counter;
        }

        console.assert(counter === arr.length, "For in: Iterate over simple array of numbers failed");
    }

    // Iterate over empty array of numbers
    {
        const arr: number[] = [];
        let counter = 0;

        for (const value in arr) {
            ++counter;
        }

        console.assert(counter === 0, "For in: Iterate over empty array of numbers failed");
    }

    // Iterate over array of strings
    {
        const arr = ["first", "second", "third"];
        let counter = 0;

        for (const value in arr) {
            console.assert(counter.toString() === value, "For in: Iterate over array of strings failed");
            ++counter;
        }

        console.assert(counter === arr.length, "For in: Iterate over array of strings size check failed");
    }

    // Iterate over array + continue
    {
        const arr = [1, 2, 3];
        let counter = 0;

        for (const value in arr) {
            if (counter === 0) {
                continue;
            }

            ++counter;
        }

        console.assert(counter === 0, "For in: Iterate over array + continue size check failed");
    }

    // Iterate over array + break
    {
        const arr = [1, 2, 3];
        let counter = 0;

        for (const value in arr) {
            console.assert(counter.toString() === value, "For in: Iterate over array + break failed");

            if (counter === 1) {
                break;
            }

            ++counter;
        }

        console.assert(counter === 1, "For in: Iterate over array + break counter value check failed");
    }

    // Iterate over array returned by a function
    {
        let counter = 0;
        const arr = [1, 2, 3];
        function retArrayFunc() {
            return arr;
        }

        for (const value in retArrayFunc()) {
            console.assert(counter.toString() === value, "For in: Iterate over array returned by a function failed");
            ++counter;
        }

        console.assert(counter === arr.length, "For in: Iterate over array returned by a function counter value check failed");
    }

    // Iterate over array of objects
    {
        const obj = { name: "10" };
        let counter = 0;
        const arr = [obj, obj, obj];

        for (const value in arr) {
            console.assert(counter.toString() === value, "For in: Iterate over array of objects failed");
            ++counter;
        }

        console.assert(counter === arr.length, "For in: Iterate over array of objects counter value check failed");
    }

    // Iterate over simple arrays using nested loops
    {
        const outerArray = [1, 2, 3];
        const innerArray = ["MyStr1", "MyStr2"];
        let outerCounter = 0;

        for (const outerValue in outerArray) {
            let innerCounter = 0;
            console.assert(outerCounter.toString() === outerValue, "For in: Iterate over simple arrays outer loop failed");
            for (const innerValue in innerArray) {
                console.assert(innerCounter.toString() === innerValue, "For in: Iterate over simple arrays inner loop failed");
                ++innerCounter;
            }
            console.assert(innerCounter === innerArray.length, "For in: Iterate over simple arrays innerCounter value check failed");

            ++outerCounter;
        }

        console.assert(outerCounter === outerArray.length, "For in: Iterate over simple arrays outerCounter value check failed");
    }

    // Iterate over simple arrays using nested loops + continue
    {
        const outerArray = [1, 2, 3];
        const innerArray = ["MyStr1", "MyStr2"];
        let outerCounter = 0;

        for (const outerValue in outerArray) {
            let innerCounter = 0;
            for (const innerValue in innerArray) {

                if (innerCounter === 0) {
                    continue;
                }

                ++innerCounter;
            }
            console.assert(innerCounter === 0, "For in: Iterate over simple arrays + continue innerCounter value check failed");

            ++outerCounter;
        }

        console.assert(outerCounter === outerArray.length, "For in: Iterate over simple arrays + continue outerCounter value check failed");
    }

    // Iterate over simple arrays using nested loops + break
    {
        const outerArray = [1, 2, 3];
        const innerArray = ["MyStr1", "MyStr2"];
        let outerCounter = 0;

        for (const outerValue in outerArray) {
            let innerCounter = 0;
            console.assert(outerCounter.toString() === outerValue, "For in: Iterate over simple arrays outer loop + break failed");
            for (const innerValue in innerArray) {
                console.assert(innerCounter.toString() === innerValue, "For in: Iterate over simple arrays inner loop + break failed");

                if (innerCounter === 1) {
                    break;
                }

                ++innerCounter;
            }
            console.assert(innerCounter === 1, "For in: Iterate over simple arrays + break innerCounter value check failed");

            ++outerCounter;
        }

        console.assert(outerCounter === outerArray.length, "For in: Iterate over simple arrays + break outerCounter value check failed");
    }
}

// Test conditionless 'break'
{
    const qqq = [1, 2, 3, 4, 5];

    for (const _ in qqq) {
        break;
    }
}

{
    const are_equal_arrays = function (a: Array<string>, b: Array<string>): boolean {
        let result = false;

        if (a.length === b.length) {
            result = true;
            for (let i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) {
                    result = false;
                    break;
                }
            }
        } else {
            result = false;
        }

        return result;
    };

    const obj = { a: 1, b: 2, c: 3 };
    const expected = ["a", "b", "c"];

    for (let prop in obj) {
        prop = "22"
    }

    console.assert(are_equal_arrays(Object.keys(obj), expected), "For..in shouldn't change iteration source");
}

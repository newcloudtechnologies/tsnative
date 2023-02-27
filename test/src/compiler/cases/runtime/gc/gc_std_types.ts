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

function checkNumbers() {
    let i = 5;
    let j = 125;
    let k = -999.046;

    let z = i + j;
    z = i - j;
    z = i * j;
    z = i / j;
    z = i % j;
    z = i ^ j;
    z = i || j;
    z = -z;

    let isSafe = Number.isSafeInteger(z);
    let parsed = Number.parseFloat("11.37");

    z += 1;
    z -= 3;

    let eq = z === k;
    let min = Number.MIN_SAFE_INTEGER;
    let str = min.toString();
}

function checkBools() {
    let t = true;
    let f = false;
    let str = t.toString();
}

function checkUnions() {
    let primitivesUnion: number | string = "abcaba";
    primitivesUnion = 10;

    let optionalUnion: number | undefined = 15;
    optionalUnion = undefined;

    class A {

    }

    class B extends A {

    }
    let nonPrimitiveUnion: A | B = new A();
    nonPrimitiveUnion = new B();

    let unionOfThree: A | B | boolean = true;
    unionOfThree = new A();
    unionOfThree = new B();
}

function checkStrings() {
    let s1 = "";
    s1 += "abacaba";

    let s2 = s1;
    s2 = s2 + "asdadas";

    let s3 = s1.concat(s2);
    let s4 = s3.trim();

    let s5 = s4.substring(1);
    s5 = "";
}

function checkTuples() {
    let primitivesTuple: [number, string] = [1, "Steve"];
    primitivesTuple[0] = 10;
    primitivesTuple[0] += primitivesTuple[0]

    // TODO Blocked by https://jira.ncloudtech.ru:8090/browse/TSN-381
    // let [v1, v2] = primitivesTuple;
    // v1 = 0;
    // v2 = "";

    class A {

    }

    class B extends A {

    }

    let nonPrimitivesTuple: [A, B] = [new A, new B];
    nonPrimitivesTuple[0] = new A();

    // TODO Blocked by https://jira.ncloudtech.ru:8090/browse/TSN-381
    // let [a, b] = nonPrimitivesTuple;
    // b = new B();
}

function checkArray() {
    let arr = [-1, -2, -3, -4, -5, -6, -7];
    arr.push(-8, -9, -10);

    let arrStr = new Array<string>();
    arrStr.push("one", "two", "three");

    let arr3 = arr.splice(2,2);

    let sum = 0;
    arr.forEach(element => {
        sum += element;
    });

    arr[3] = 111111;

    class El {
        _val = 44;
        _sval = "www";
    }

    let arrWithCustomClass = [new El(), new El(), new El(), new El()];
    arrWithCustomClass.push(new El());

    let size = arrWithCustomClass.length;
}

function checkMap() {
    let map = new Map<number, string>();
    map.set(11, "aa").set(22, "bb").set(33, "cc");

    let sum = 0;
    map.forEach((val, key) => {sum += key;});

    let el = map.get(11);
    let size = map.size;
    map.delete(22);
}

function checkSet() {
    let _set = new Set<number>();
    _set.add(44).add(55).add(66);
    _set.add(11000);

    let has = _set.has(1100);
    _set.delete(1100);

    let sum = 0;
    let size = _set.size;

    _set.forEach((v) => {sum += v;});
}

function checkLiteralObjects() {
    let simpleLiteralObj = { a: 10 };
    let compositeLiteralObj = {
        primitive: "adsasda",
        fnc: () => {},
        slo: simpleLiteralObj
    };

    simpleLiteralObj.a = 15;

    compositeLiteralObj.primitive = "some str";
    compositeLiteralObj.fnc = () => {
        console.log("My super string");
    };
    compositeLiteralObj.slo = {a: 150};
}

function checkTSClasses() {
    class Base {
        n: number;

        constructor(nn: number) {
            this.n = nn;
        }

        get getN() {
            return this.n;
        }

        set setN(nn: number) {
            this.n = nn;
        }

        sum(a: number, b: number) {
            this.n = a + b;
        }

        clone(): Base {
            return new Base(this.n);
        }

        static staticFoo() {
            let a = new Base(15);
            a.setN = 10;
        }
    }

    class Derived extends Base {
        private s: string;

        constructor(ss: string) {
            super(10);
            this.s = ss;
        }

        sum(a: number, b: number) {
            this.n = a * a + b * b;
        }
    }

    const base = new Base(15)
    const derived = new Derived("derived");

    const n1 = base.getN;
    base.setN = n1;

    base.sum(n1, base.getN);
    let baseClone = base.clone();
    Base.staticFoo();

    derived.sum(10, 15);
    const n3 = base.getN;
    base.setN = n3;

    base.sum(n1, derived.getN);
    let derivedClone = base.clone();
    Derived.staticFoo();
}

function checkDates() {
    const date1 = new Date(1995, 11, 17, 3, 24, 0);
    const date2 = new Date('1995-12-17T04:24:00');

    const diff = date2.getTime() - date1.getTime();

    const now = Date.now();
    now.toString();
}

gcTest(checkBools, "Check Bools");
gcTest(checkNumbers, "Check Numbers");
gcTest(checkUnions, "Check Unions");
gcTest(checkStrings, "Check Strings");
gcTest(checkTuples, "Check Tuples");
gcTest(checkArray, "Check Array");
gcTest(checkMap, "Check Map");
gcTest(checkSet, "Check Set");
gcTest(checkLiteralObjects, "Check Literal Objects");
gcTest(checkTSClasses, "Check Classes");
gcTest(checkDates, "Check Dates");

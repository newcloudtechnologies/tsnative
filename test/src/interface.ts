/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

{
    const aInitializer = 5;
    const sInitializer = "via";
    const fooRet = "Foo";

    class Wow_t {
        constructor(a: number, s: string) {
            console.assert(a === aInitializer && s === sInitializer, "Wow_t constructor");
        }

        foo() {
            return fooRet;
        }
    }

    interface Wow_args {
        a: number,
        s: string
    }

    function Wow(args: Wow_args) {
        return new Wow_t(args.a, args.s);
    }

    const fooResult = Wow({
        a: aInitializer,
        s: sInitializer
    }).foo();

    console.assert(fooResult === fooRet, "Call on class instance initialized by interface-typed object");

    const wInitializer = 10;
    const hInitializer = 15;

    interface MySize {
        w: number,
        h: number,
    }

    interface MySidePanel_args {
        size: MySize,
    }

    function create(args: MySidePanel_args) {
        console.assert(args.size.w === wInitializer && args.size.h === hInitializer, "Complex object argument to interface-typed parameter");
    }

    create({
        size: {
            w: wInitializer,
            h: hInitializer
        }
    });
}

{
    interface Summator {
        (a: number, b: number): number
    }

    const s: Summator = (a, b) => a + b

    console.assert(s(1, 2) === 3, "Interface as function type");
}
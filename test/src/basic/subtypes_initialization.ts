/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

{
    // Union-typed parameter initialization by its subtypes, including unions as well

    interface A {
        type: string
        a: string
    }

    interface B {
        type: string
        b: number
    }

    interface C {
        type: string
        c: number
    }

    const acceptsABCunion = function (v: A | B | C) {
        switch (v.type) {
            case "typeA":
                console.assert((v as A).a === "22", "typeA case failed")
                break;
            case "typeB":
                console.assert((v as B).b === 22, "typeB case failed")
                break;
            case "typeC":
                console.assert((v as C).c === 42, "typeC case failed")
                break;
            default:
                break;
        }
    }

    function returnsABunion(): A | B {
        const o: A = {
            type: "typeA",
            a: "22"
        };
        return o;
    }

    function returnsB(): B {
        const o: B = {
            type: "typeB",
            b: 22
        };
        return o;
    }

    function returnsBCunion(): B | C {
        const o: C = {
            type: "typeC",
            c: 42
        };
        return o;
    }

    acceptsABCunion(returnsABunion())
    acceptsABCunion(returnsB())
    acceptsABCunion(returnsBCunion())
}

import { test } from "./dummy_ns"

{
    interface D {
        d1: string
        d2: number
    }

    interface E {
        e1: number
        e2: string
    }

    interface F {
        f1: string
    }

    interface G {
        g1: number
    }

    const acceptsD_returnsNewD = (d: D, f: F): D => {
        test.value

        return {
            ...d
        };
    }

    const acceptsD_returnsModifiedD = (d: D, f: F): D => {
        d.d1 = "a1_modified"
        d.d2 += 1;
        return d;
    }

    const acceptsE_returnsNewE = function (e: E, g: G): E {
        return {
            ...e
        };
    }

    const acceptsE_returnsModifiedE = function (e: E, g: G): E {
        e.e1 = 2
        return e;
    }

    function combine(
        acceptsDF_returnsD: (_d: D, _f: F) => D,
        acceptsEG_returnsE: (_e: E, _g: G) => E,
    ): (_ge: D & E, _fg: F | G) => D & E {
        return function (de: D & E, fg: F | G): D & E {
            {
                const d: D = acceptsDF_returnsD(de, (fg as F));
                if (d !== de) {
                    return {
                        ...de,
                        ...d
                    };
                }
            }

            {
                const e: E = acceptsEG_returnsE(de, (fg as G));
                if (e !== de) {
                    return {
                        ...de,
                        ...e
                    };
                }
            }

            return de;
        }
    }

    const firstCombine = combine(acceptsD_returnsNewD, acceptsE_returnsModifiedE);
    const firstResult = firstCombine({ d1: "1", d2: 2, e1: 3, e2: "4" }, { f1: "c", g1: 3 });
    console.assert(firstResult.d1 === "1", "firstResult: 1");
    console.assert(firstResult.d2 === 2, "firstResult: 2");
    console.assert(firstResult.e1 === 3, "firstResult: 3");
    console.assert(firstResult.e2 === "4", "firstResult: 4");

    const secondCombine = combine(acceptsD_returnsModifiedD, acceptsE_returnsNewE);
    const secondResult = secondCombine({ d1: "1", d2: 2, e1: 3, e2: "4" }, { f1: "c", g1: 3 });
    console.assert(secondResult.d1 === "a1_modified", "secondResult: 1");
    console.assert(secondResult.d2 === 3, "secondResult: 2");
    console.assert(secondResult.e1 === 3, "secondResult: 3");
    console.assert(secondResult.e2 === "4", "secondResult: 4");
}

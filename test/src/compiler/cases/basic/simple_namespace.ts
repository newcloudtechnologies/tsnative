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

namespace A {
    export const a = 10;
}
console.assert(A.a === 10, "Namespaces: Simplest A.a failed");

namespace B {
    export namespace C {
        export const b = 15;
    }
}
console.assert(B.C.b === 15, "Namespaces: B.C.b failed");

namespace D {
    export enum E {
        ENTRY1 = 1,
        ENTRY2 = 2
    }
}
console.assert(D.E.ENTRY1 === 1, "Namespaces: D.E.ENTRY1 failed");
console.assert(D.E.ENTRY2 === 2, "Namespaces: D.E.ENTRY2 failed");

namespace E {
    export const val1 = 15;
}
namespace E {
    export const val2 = 20;
}
console.assert(E.val1 === 15, "Namespaces: E.val1 failed");
console.assert(E.val2 === 20, "Namespaces: E.val2 failed");

namespace F {
    export namespace G {
        export namespace H {
            export namespace I {
                export function foo() {
                    return 150;
                }
            }
        }
    }
}
console.assert(F.G.H.I.foo() === 150, "Namespaces: F.G.H.I.foo() failed");

namespace J {
    export namespace K {
        export namespace L {
            export const val3 = 100;
        }
    }
}
namespace J {
    export namespace K {
        export namespace L {
            export const val4 = 150;
        }
    }
}
console.assert(J.K.L.val3 === 100, "Namespaces: J.K.L.val3 failed");
console.assert(J.K.L.val4 === 150, "Namespaces: J.K.L.val4 failed");

namespace M {
    export namespace N {
        export const val5 = 1000;
    }
}
namespace O {
    export namespace N {
        export const val6 = 5000;
    }
}
console.assert(M.N.val5 === 1000, "Namespaces: M.N.val5 failed");
console.assert(O.N.val6 === 5000, "Namespaces: O.N.val6 failed");

// TODO Classes and interfaces inside of namespaces are not supported for now
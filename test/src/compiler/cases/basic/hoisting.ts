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

{
    function f() {
        console.assert(i === 1);
    }

    const i = 1;

    f();
}

{
    function f() {
        function ff() {
            console.assert(i === 22, "");
        }

        const i = 22;

        ff();
    }

    f();
}

{
    const f = () => {
        function ff() {
            console.assert(i === 22, "");
        }

        const i = 22;

        ff();
    }

    f();
}

{
    class C {
        constructor() {
            function ff() {
                console.assert(i === 22, "");
            }

            const i = 22;

            ff();
        }

        m() {
            function fn() {
                console.assert(n === 22, "");
            }

            const n = 22;

            fn();
        }
    }

    new C();
    new C().m();
}

{
    class B {
        constructor() {
            function ff() {
                console.assert(i === 22, "");
            }

            const i = 22;

            ff();
        }

        m() {
            function fn() {
                console.assert(n === 22, "");
            }

            const n = 22;

            fn();
        }
    }

    class C extends B { }

    new C().m();
}

{
    const o = {
        fn: function () {
            function ff() {
                console.assert(i === 22, "");
            }

            const i = 22;

            ff();
        }
    }

    o.fn();
}

{
    if (true) {
        function f() {
            console.assert(i === 1);
        }

        const i = 1;

        f();
    }
}

{
    let counter = 1;

    while (counter-- > 0) {
        function f() {
            console.assert(i === 1);
        }

        const i = 1;

        f();
    }
}

{
    for (let i = 0; i < 1; ++i) {
        function f() {
            console.assert(i === 1);
        }

        const i = 1;

        f();
    }
}

{
    const value = "5";

    hoisted(value);

    function hoisted(str: string) {
        console.assert(str === value, "Function declarations must be hoisted, that is, it must be possible to use function declaration before definition");
    }
}

// Checks compilation only
namespace Flex {
    export function a() {
    }
}

class ClassType {
    constructor() {
        Flex.a();
    }
}

function classCreator(): ClassType {
    return new ClassType();
}
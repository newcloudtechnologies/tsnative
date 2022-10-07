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

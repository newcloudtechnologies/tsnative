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
    interface A { a: string }
    const a: A = { a: "2" };

    {
        interface A { a: number }
        const a: A = { a: 22 };

        console.assert(a.a === 22, "Scopes test failed(1)");
    }

    console.assert(a.a === "2", "Scopes test failed(2)");
}
{
    interface A { a: number }
    const a: A = { a: 22 };
    a.a += 2;

    console.assert(a.a === 24, "Scopes test failed(3)");
}

{
    class A { a: string = "22" }
    const a = new A;

    // @todo:
    // Error: Cannot adjust 'double' to '%A__class__3370b876544b645ee6180aa466d3fbdfd7bab13cffa1cb9edb389ef17c0f748b = type { %string* }'
    // at LLVMValue.adjustToType
    // at LLVMValue.adjustToType
    // at LLVMValue.makeAssignment
    /*
    {
        class A { a: number = 5 }
        const a = new A;

        console.assert(a.a === 5, "Scopes test failed(4)");
    }
    */

    console.assert(a.a === "22", "Scopes test failed(5)");
}
{
    class A { a: number = 22 }
    const a = new A;
    a.a += 2;

    console.assert(a.a === 24, "Scopes test failed(6)");
}

{
    function f(n: number) {
        return n * 2;
    }

    console.assert(f(3) === 6, "Scopes test failed(7)");
}
{
    function f(s: string) {
        return s + "_______";
    }

    console.assert(f("3") === "3_______", "Scopes test failed(8)");
}

{
    function f(fn: () => number) {
        return fn;
    }

    const fn = f(() => 2);
    console.assert(fn() === 2, "Scopes test failed(9)");
}
{
    function f(fn: () => string) {
        return fn;
    }

    const fn = f(() => "hello");
    console.assert(fn() === "hello", "Scopes test failed(10)");
}

{
    class MyComponent {
        _isStateChanged = false;
        _renderCounter = 0;

        setState(reducer: ((state: string) => void)): void {
            { // Sub-scope is quite important
                const quiteImportantUnusedVar = "some text";
                reducer("prev data2");
                this._isStateChanged = true;
                this.render();
            }
        }

        protected render() {
            this._renderCounter += 1;

            const _ = ((): void => {
                this.setState((_: string): void => { });
            });
        }
    }

    const obj = new MyComponent();
    obj.setState((_: string): void => { });

    console.assert(obj._renderCounter === 1, "Function scoped locals (1)");
    console.assert(obj._isStateChanged === true, "Function scoped locals (2)");
}

{
    class Wow {
        foo(): boolean {
            let bar = (): string => {
                let unused = "lol";
                return unused;
            }

            return bar() === (() => {
                let unused = "lol";
                return unused;
            })();
        }
    }

    console.assert((new Wow).foo(), "Duplicate names in function scopes shouldn't populate scope locals");
}

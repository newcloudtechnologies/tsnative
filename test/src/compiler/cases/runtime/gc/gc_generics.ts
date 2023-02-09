import { gcTest } from "./gc_test_fixture";

function checkGenericFunctions() {
    function simpleGeneric<T>(abc: T): T {
        let obj = {field: "abcaba"};
        obj.field = "asdasda";

        return abc;
    }

    const n1 = simpleGeneric(10);
    const s2 = simpleGeneric("abcaba");

    const genericLambda = <T,>(x: T) => {
        let obj = {field: "abcaba"};
        obj.field = "asdasda";

        return x;
    };
    const r1 = genericLambda({});
    const r2 = genericLambda(Date.now());
}

function checkGenericClasses() {
    class MyClass<T> {
        field: T;
        constructor(t: T) {
            this.field = t;
        }

        get getField() {
            return this.field;
        }

        set setField(nt: T) {
            this.field = nt;
        }

        foo() : T {
            let other = this.field;
            return other;
        }
    }

    let obj1 = new MyClass<number>(10);
    obj1.setField = obj1.getField + 15;
    const r = obj1.foo()
    console.assert(r === 25, "GC generic classes: check r is alive");

    class A {
        s = "abcabca";
    }

    let obj2 = new MyClass<A>(new A());
    obj2.foo().s = "new value";
}

gcTest(checkGenericFunctions, "Check generic functions");
gcTest(checkGenericClasses, "Check generic classes");
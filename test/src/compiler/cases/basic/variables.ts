// Test underscored names
{
    function test(_: string) {
        let b = _;
    }

    test("Lol");

    class MyType {
        str: string = "0";
    }

    let __tmp_data = new MyType();
    __tmp_data.str = "777";
}

{
    class C {
        s: string;

        constructor(s: string) {
            this.s = s;
        }
    }

    const arr: C[] = [];

    const a = new C("a");
    arr.push(a);

    let b: C;
    b = new C("b");
    arr[0] = b;

    console.assert(arr[0].s === "b", "Late initialization");
}

{
    let i = 0;
    let n = i;

    ++i;

    console.assert(i === 1 && n === 0, "Number is a value");
}

{
    let num = 123;
    let negated = -num;
    console.assert(num === 123 && negated === -123, "Unary negate test on number");

    num = -123.5;
    negated = -num;
    console.assert(num === -123.5 && negated === 123.5, "Unary negate test on number #2");

    num = 0.0;
    negated = -num;
    console.assert(num === 0.0 && negated === 0.0, "Unary negate test on number #3");
}

{
    let stat = true;
    let other = !stat;

    console.assert(stat === true && other === false, "Unary negate test on boolean");
}

{
    let s = "0s";
    let q = s;

    s += "_";

    console.assert(s === "0s_" && q === "0s", "String is a value");
}

{
    let b = false;
    let p = b;

    b = !b;

    console.assert(b && !p, "Boolean is a value");
}

{
    function f(n: number) {
        n += 1;
    }

    const i = 0;
    f(i);
    console.assert(i === 0, "Number immutability");
}

{
    function f(s: string) {
        s += "_1";
    }

    const s = "0!!!";
    f(s);
    console.assert(s === "0!!!", "String immutability");
}

{
    function f(b: boolean) {
        b = !b;
    }

    const b = false;
    f(b);
    console.assert(!b, "Boolean immutability (1)");
}

{
    function f(handler: (b: boolean) => void, value: boolean) {
        handler(value);
    }

    const b = false;
    f((b: boolean) => {
        b = !b;
    }, b);
    console.assert(!b, "Boolean immutability (2)");
}
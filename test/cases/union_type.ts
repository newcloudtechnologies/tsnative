{
    interface A {
        a: number
        b: string
    }

    interface B {
        c: number
    }

    let union: A | B = { a: 12, b: "h" }

    console.log(union.a)
    console.log(union.b)

    union = { c: 909 }
    console.log(union.c)
}

{
    let union: boolean | number = 12;
    console.log(union)
    union = false;
    console.log(union)
}
{
    let union: string | number = "h";
    console.log(union)
    union = 22;
    console.log(union)
}
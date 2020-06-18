interface A {
    a: number
    b: string
}

interface B {
    c: number
}

let intersection: A & B = {
    a: 1,
    b: "h",
    c: 0
}

console.log(intersection.a)
console.log(intersection.b)
console.log(intersection.c)
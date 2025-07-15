{
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

  console.assert(intersection.a === 1, "intersection: intersection.a === 1 failed");
  console.assert(intersection.b === "h", "intersection: intersection.b === 'h' failed");
  console.assert(intersection.c === 0, "intersection: intersection.c === 0 failed");
}

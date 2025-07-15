{
  // prefix exclamation test
  const b: boolean = false;
  console.assert(!b, "False boolean prefix exclamation test failed");
  const i: number = 0;
  console.assert(!i, "Zero number prefix exclamation test failed");
  const k: number = 1;
  console.assert(!!k, "Non-zero prefix exclamation test failed");
  const sEmpty: string = "";
  console.assert(!sEmpty, "Empty string prefix exclamation test failed");
  const s: string = "123";
  console.assert(!!s, "Non-empty string prefix exclamation test failed");
}
{
  // AND/OR: de Morgan's laws
  const b1: boolean = false;
  const b2: boolean = true;
  console.assert(!(b1 && b2) === (!b1 || !b2), "Conjuction negate test failed");
  console.assert(!(b1 || b2) === (!b1 && !b2), "Disjuction negate test failed");
}

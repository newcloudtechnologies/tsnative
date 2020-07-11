let u: undefined;
console.assert(!u, "Undefined type initialization failed");

let optionalUnion: string | number | undefined;
console.assert(!optionalUnion, "Non-initialized union test failed");

optionalUnion = "A";
console.assert(optionalUnion === "A", "Union comparison failed");

optionalUnion = 1;
console.assert(optionalUnion === 1, "Union comparison failed");

optionalUnion = undefined;
console.assert(!optionalUnion, "Active undefined test failed");
const a = { v: 12 };
const b = { v: 12 };

console.assert(a !== b, "Object not equals comparison failed");
console.assert(a === a, "Object equals comparison failed");
console.assert(b === b, "Object equals comparison failed");
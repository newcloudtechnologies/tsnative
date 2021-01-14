import { Acceptor } from "./declarations/cpp"

const a = new Acceptor;

console.assert(a.sumInt8(1, 1) === 2, "sumInt8 failed");
console.assert(a.sumInt16(1, 1) === 2, "sumInt16 failed");
console.assert(a.sumInt32(1, 1) === 2, "sumInt32 failed");
console.assert(a.sumInt64(1, 1) === 2, "sumInt64 failed");

console.assert(a.sumUInt8(1, 1) === 2, "sumUInt8 failed");
console.assert(a.sumUInt16(1, 1) === 2, "sumUInt16 failed");
console.assert(a.sumUInt32(1, 1) === 2, "sumUInt32 failed");
console.assert(a.sumUInt64(1, 1) === 2, "sumUInt64 failed");
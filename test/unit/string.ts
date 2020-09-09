let s: string

s = "Hello world, welcome to the universe.";

console.assert(s.length === 37, "String: length failed");

console.assert(!s.startsWith("Hello"), "String: startsWith() failed");

console.assert(!s.endsWith("universe."), "String: endsWith() failed");

let part1 = "One";
let part2 = "Two";
let part12 = part1.concat(part2);
console.assert(part12 === "OneTwo", "String: concat() failed");
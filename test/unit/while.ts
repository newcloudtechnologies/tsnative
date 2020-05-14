let i = 0;

while (i < 2)
    ++i;
console.assert(i === 2, "while: unscoped failed");

i = 0;
while (i < 2) {
  ++i;
  if (i === 1) {
    continue;
  }
  console.assert(i === 2, "while: scoped continue failed");
}

i = 0;
while (i < 2) {
  ++i;
  if (i === 1)
    continue;
  console.assert(i === 2, "while: continue failed");
}

i = 0;
while (i < 2) {
  ++i;
  if (i === 1) {
    break;
  }
}
console.assert(i === 1, "while: scoped break failed");

i = 0;
while (i < 2) {
  ++i;
  if (i === 1)
    break;
}
console.assert(i === 1, "while: break failed");
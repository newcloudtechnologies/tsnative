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

{
  const arr = [1, 2]

  let counter = 0;

  while (true) {
    const flagB = true

    for (const _ of arr) {
      ++counter;
    }

    ++counter;

    if (flagB) {
      break;
    }
  }

  console.assert(counter === 3, "'break' must works correctly if there is a nested loop");
}

// Test conditionless 'break'
{
  while (true) {
    break;
  }
}

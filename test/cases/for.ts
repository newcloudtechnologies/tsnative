const COUNT = 10;

// with initializer, condition and incrementor
for (let i = 0; i < COUNT; ++i) {}

{
  // with external initializer, condition and incrementor
  let i = 0;
  for (; i < COUNT; ++i) {}
}

// with initializer, internal condition and incrementor
for (let i = 0;; ++i) {
  if (i === COUNT)
    break;
}

// same as previous, but the `break` statement is wrapped in block
for (let i = 0;; ++i) {
  if (i === COUNT) {
    break;
  }
}

// with initializer, condition and internal incrementor
for (let i = 0; i < COUNT;) {
  ++i;
}

// with initializer, internal condition and internal incrementor
for (let i = 0;;) {
  if (i === COUNT)
    break;
  ++i;
}

{
  // with external initializer, internal condition and internal incrementor
  let i = 0;
  for (;;) {
    if (i === COUNT)
      break;
    ++i;
  }
}

// pseudo `forever` construction
for (;;) {
  if (true)
    break;
}

// `continue` statement
for (let i = 0; i < COUNT; ++i) {
  if (true)
    continue;
}

// same as previous, but the `continue` statement is wrapped in block
for (let i = 0; i < COUNT; ++i) {
  if (true) {
      continue;
  }
}
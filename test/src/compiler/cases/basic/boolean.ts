{
  const assign_true = (x: boolean): boolean => {
    let a = false;
    a = x;
    return a;
  };

  const assign_false = (x: boolean): boolean => {
    let a = true;
    a = x;
    return a;
  };

  const toggle = (x: boolean): boolean => {
    x = !x;
    return x;
  };

  console.assert(assign_true(true) === true, "boolean: assign_true(true) failed");
  console.assert(assign_false(false) === false, "boolean: assign_false(false) failed");
  console.assert(toggle(false) === true, "boolean: toggle(false) failed");
  console.assert(toggle(true) === false, "boolean: toggle(true) failed");
}

{
  const f1 = () => 1;
  const f2 = () => 2;

  console.assert((f2() === 2 ? f2 : f1)() === 2, "Ternary operator test failed");
}
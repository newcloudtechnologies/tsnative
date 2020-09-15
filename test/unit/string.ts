{
  let s: string

  s = "Hello world, welcome to the universe.";

  console.assert(s.length === 37, "String: length failed");
}

{
  let s: string = "Hello world, welcome to the universe.";

  console.assert(!s.startsWith("Hello"), "String: startsWith() failed");
  console.assert(!s.endsWith("universe."), "String: endsWith() failed");
}

{
  let s: string = "Hello world, welcome to the universe.";

  let part1 = "One";
  let part2 = "Two";
  let part12 = part1.concat(part2);
  console.assert(part12 === "OneTwo", "String: concat() failed");
}

{
  const str = 'Transplantation';

  console.assert(str.slice(5) === "plantation", "String: slice(5) failed");
  console.assert(str.slice(-4) === "tion", "String: slice(-4) failed");
  console.assert(str.slice(50) === "", "String: slice(50) failed");
  console.assert(str.slice(-50) === "Transplantation", "String: slice(-50) failed");

  console.assert(str.slice(5, 9) === "plan", "String: slice(5, 9) failed");
  console.assert(str.slice(-10, -5) === "plant", "String: slice(-10, -5) failed");
  console.assert(str.slice(-10, 10) === "plant", "String: slice(-10, 10) failed");
}

{
  const str = 'Transplantation';

  console.assert(str.substring(0) === "Transplantation", "String: substring(0) failed");
  console.assert(str.substring(5) === "plantation", "String: substring(5) failed");
  console.assert(str.substring(50) === "", "String: substring(50) failed");
  console.assert(str.substring(-5) === "Transplantation", "String: substring(-5) failed");

  console.assert(str.substring(0, 5) === "Trans", "String: substring(0, 5) failed");
  console.assert(str.substring(-2, 4) === "Tran", "String: substring(-2, 4) failed");
  console.assert(str.substring(-2, -4) === "", "String: substring(-2, -4) failed");
  console.assert(str.substring(3, 3) === "", "String: substring(3, 3) failed");
  console.assert(str.substring(0, 50) === "Transplantation", "String: substring(0, 50) failed");
}

{
  const str = '\n\t\r   Transplantation  ';

  console.assert(str.trim() === "Transplantation", "String: trim() failed");
}
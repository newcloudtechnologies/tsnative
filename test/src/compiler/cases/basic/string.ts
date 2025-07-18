{
  let s: string = "Hello world, welcome to the universe.";

  console.assert(s.length === 37, "String: length failed");
  console.assert("".length === 0, "String: ''.length failed");
}

{
  let str: string = "Hello world, welcome to the universe.";

  console.assert(str.startsWith("Hello"), "String: startsWith('Hello') failed");
  console.assert(!str.startsWith("world"), "String: startsWith('world') failed");
  console.assert(str.startsWith("world", 6), "String: startsWith('world', 6) failed");
  console.assert("".startsWith(""), "String: ''.startsWith('') failed");
  console.assert("".startsWith("", 3), "String: ''.startsWith('', 3) failed");
  console.assert(!"".startsWith("a"), "String: !''.startsWith('a') failed");
  console.assert(!"".startsWith("a", 3), "String: !''.startsWith('a', 3) failed");
}

{
  let str: string = "Hello world, welcome to the universe.";

  console.assert(str.endsWith("universe."), "String: endsWith() failed");
  console.assert(!str.endsWith("world", 0), "String: endsWith('world', 0) failed");
  console.assert(str.endsWith("world", 11), "String: endsWith('world', 11) failed");
  console.assert("".endsWith(""), "String: endsWith('') failed");
  console.assert("".endsWith("", 3), "String: endsWith('', 3) failed");
  console.assert(!"".endsWith("a"), "String: !endsWith('a') failed");
  console.assert(!"".endsWith("a", 3), "String: !endsWith('a', 3) failed");
}

{
  let s: string = "Hello world, welcome to the universe.";

  let part1 = "One";
  let part2 = "Two";
  let part12 = part1.concat(part2);
  console.assert(part12 === "OneTwo", "String: concat() failed");
  console.assert("".concat("") === "", "String: ''.concat('') failed");
}

{
  const str = 'Transplantation';

  console.assert(str.slice(5) === "plantation", "String: slice(5) failed");
  console.assert(str.slice(-4) === "tion", "String: slice(-4) failed");
  console.assert(str.slice(50) === "", "String: slice(50) failed");
  console.assert(str.slice(-50) === "Transplantation", "String: slice(-50) failed");
  console.assert("".slice(50) === "", "String: ''.slice(50) failed");
  console.assert("".slice(-50) === "", "String: ''.slice(-50) failed");

  console.assert(str.slice(5, 9) === "plan", "String: slice(5, 9) failed");
  console.assert(str.slice(-10, -5) === "plant", "String: slice(-10, -5) failed");
  console.assert(str.slice(-10, 10) === "plant", "String: slice(-10, 10) failed");
  console.assert("".slice(5, 9) === "", "String: ''.slice(5, 9) failed");
  console.assert("".slice(-10, 10) === "", "String: ''.slice(-10, 10) failed");
}

{
  const str = 'Transplantation';

  console.assert(str.substring(0) === "Transplantation", "String: substring(0) failed");
  console.assert(str.substring(5) === "plantation", "String: substring(5) failed");
  console.assert(str.substring(50) === "", "String: substring(50) failed");
  console.assert(str.substring(-5) === "Transplantation", "String: substring(-5) failed");
  console.assert("".substring(0) === "", "String: ''.substring(0) failed");

  console.assert(str.substring(0, 5) === "Trans", "String: substring(0, 5) failed");
  console.assert(str.substring(-2, 4) === "Tran", "String: substring(-2, 4) failed");
  console.assert(str.substring(-2, -4) === "", "String: substring(-2, -4) failed");
  console.assert(str.substring(3, 3) === "", "String: substring(3, 3) failed");
  console.assert(str.substring(0, 50) === "Transplantation", "String: substring(0, 50) failed");
  console.assert("".substring(0, 50) === "", "String: ''.substring(0, 50) failed");
}

{
  const str = '\n\t\r   Transplantation  ';

  console.assert(str.trim() === "Transplantation", "String: trim() failed");
  console.assert("".trim() === "", "String: ''.trim() failed");
}

{
  const str = 'Transplantation';

  console.assert(str.toLowerCase() === "transplantation", "String: toLowerCase() failed");
  console.assert("".toLowerCase() === "", "String: ''.toLowerCase() failed");
}

{
  const str = 'Transplantation';

  console.assert(str.toUpperCase() === "TRANSPLANTATION", "String: toUpperCase() failed");
  console.assert("".toUpperCase() === "", "String: ''.toUpperCase() failed");
}

{
  let str: string = "Transplantation";

  console.assert(str.includes("plant") === true, "String: includes('plant') failed");
  console.assert(str.includes("plant", 6) === false, "String: includes('plant', 6) failed");

  console.assert(str.includes("") === true, "String: includes('') failed");
  console.assert(str.includes("", 6) === true, "String: includes('', 6) failed");

  console.assert("".includes("") === true, "String: ''.includes('') failed");
  console.assert("".includes("", 6) === true, "String: ''.includes('', 6) failed");
}

{
  let str: string = "The quick brown fox jumps over the lazy dog";

  var empty1: string[] = "".split("");
  console.assert(empty1.length === 0, "String: ''.split('') failed");

  var empty_str: string[] = [];

  empty_str = "".split("x");
  console.assert(empty_str.length === 1 && empty_str[0] === "", "String: ''.split('x') failed");

  empty_str = "".split("x", 6);
  console.assert(empty_str.length === 1 && empty_str[0] === "", "String: ''.split('x', 6) failed");

  let tokens = str.split(" ");

  console.assert(tokens.length === 9, "String: str.split(' ') failed");
  console.assert(tokens[0] === "The", "String: tokens[0] failed");
  console.assert(tokens[3] === "fox", "String: tokens[3] failed");
  console.assert(tokens[7] === "lazy", "String: tokens[7] failed");

  tokens = str.split(" ", 5);
  console.assert(tokens.length === 5, "String: str.split(' ', 5) failed");

  str = "lazy";
  let symbols = str.split("");
  console.assert(symbols.length === 4, "String: str.split('') failed");
  console.assert(symbols[0] === "l", "String: str.split(''): symbols[0] failed");
  console.assert(symbols[1] === "a", "String: str.split(''): symbols[1] failed");
  console.assert(symbols[2] === "z", "String: str.split(''): symbols[2] failed");
  console.assert(symbols[3] === "y", "String: str.split(''): symbols[3] failed");

  symbols = str.split("", 3);
  console.assert(symbols.length === 3, "String: str.split('', 3) failed");
  console.assert(symbols[0] === "l", "String: str.split(''): symbols[0] failed");
  console.assert(symbols[1] === "a", "String: str.split(''): symbols[1] failed");
  console.assert(symbols[2] === "z", "String: str.split(''): symbols[2] failed");
}

{
  let str: string = "Blue Whale";

  console.assert(str.indexOf("Blue") === 0, "String: indexOf('Blue'): failed");
  console.assert(str.indexOf("Blute") === -1, "String: indexOf('Blute'): failed");
  console.assert(str.indexOf("Whale", 0) === 5, "String: indexOf('Whale', 0): failed");
  console.assert(str.indexOf("Whale", 5) === 5, "String: indexOf('Whale', 5): failed");
  console.assert(str.indexOf("Whale", 7) === -1, "String: indexOf('Whale', 7): failed");
  console.assert(str.indexOf("") === 0, "String: indexOf(''): failed");
  console.assert(str.indexOf("", 9) === 9, "String: indexOf('', 9): failed");
  console.assert(str.indexOf("", 10) === 10, "String: indexOf('', 10): failed");
  console.assert(str.indexOf("", 11) === 10, "String: indexOf('', 11): failed");
}

{
  let str: string = "The quick brown fox jumps over the lazy dog. If the dog barked, was it really lazy?";
  const searchTerm = 'dog';

  let indexOfFirst1: number = str.indexOf(searchTerm);

  console.assert(indexOfFirst1 === 40, "String: indexOf('dog')#1: failed");

  let indexOfFirst2 = str.indexOf(searchTerm, (indexOfFirst1 + 1));

  console.assert(indexOfFirst2 === 52, "String: indexOf('dog')#2: failed");

  let indexOfFirst3: number = str.indexOf("bla");

  console.assert(indexOfFirst3 === -1, "String: indexOf('bla'): failed");
}

{
  let str: string = "canal";

  console.assert(str.lastIndexOf("a") === 3, "String: lastIndexOf('a'): failed");
  console.assert(str.lastIndexOf("a", 2) === 1, "String: lastIndexOf('a', 2): failed");
  console.assert(str.lastIndexOf("a", 0) === -1, "String: lastIndexOf('a', 0): failed");
  console.assert(str.lastIndexOf("x") === -1, "String: lastIndexOf('x'): failed");
  console.assert(str.lastIndexOf("c", -5) === 0, "String: lastIndexOf('c', -5): failed");
  console.assert(str.lastIndexOf("c", 0) === 0, "String: lastIndexOf('c', 0): failed");
  console.assert(str.lastIndexOf("") === 5, "String: lastIndexOf(''): failed");
  console.assert(str.lastIndexOf("", 2) === 2, "String: lastIndexOf('', 2): failed");
}

{
  let str: string = "The quick brown fox jumps over the lazy dog. If the dog barked, was it really lazy?";
  const searchTerm = 'dog';

  let indexOfFirst1: number = str.lastIndexOf(searchTerm);

  console.assert(indexOfFirst1 === 52, "String: lastIndexOf('dog')#1: failed");

  let indexOfFirst2 = str.lastIndexOf(searchTerm, (indexOfFirst1 - 1));

  console.assert(indexOfFirst2 === 40, "String: lastIndexOf('dog')#2: failed");

  let indexOfFirst3: number = str.lastIndexOf("bla");

  console.assert(indexOfFirst3 === -1, "String: lastIndexOf('bla'): failed");
}

{
  const i = 22;
  const templateStringLiteral = `${i} is ${i}, ${i}`;
  const expected = "22 is 22, 22";

  console.assert(templateStringLiteral === expected, "Template string test failed (1)");
}

{
  function getWorld() {
    return "world";
  }

  const expected = "hello world!";
  const templateStringLiteral = `hello ${getWorld() + "!"}`;

  console.assert(templateStringLiteral === expected, "Template string test failed (2)");
}

{
  const original = '1234qwerty 567 qwe';

  const sub = '1234';

  const newSub = '';

  console.assert(original.replace(sub, newSub) === "qwerty 567 qwe", "Replace failed (1)");

  console.assert(original.replace('qwe','ABCD') === "1234ABCDrty 567 qwe", "Replace failed (2)");

  console.assert('aa aa aa'.replace('aa','Word') === "Word aa aa", "Replace failed (3)");
  
  console.assert('aaa a'.replace('','!') === "!aaa a", "Replace failed (4)");

  console.assert('aaa b'.replace('aaa b','') === "", "Replace failed (5)");
}

{
  const arr: (string | number | boolean)[] = ['1', '2', '3'];
  const expected: string[] = ['1', '2', '3'];

  function check(arr: (string | number | boolean)[]) {
    for (let i = 0; i < arr.length; i++) {
        const value = arr[i];
        const valueAsString = `${value}`;
        console.assert(valueAsString === expected[i], "Any Object-derived can be cast to string using template string literal");
    }
  }

  check(arr);
}

{
  console.assert("1" + 5 === "15", "Check string + number");

  let fn = function() {
    return "fun";
  }
  let result = 'function () {\nreturn "fun";\n}';
  // TODO need to fix TSN-441
  // console.assert(fn.toString() === result, "Check fn to string");
  // console.assert("aaa" + fn === "aaa" + result, "Check string + function");
  // console.assert(fn + "aaa" === result + "aaa", "Check function + string");

  console.assert(1 + "5" === "15", "Check number + string");

  console.assert(2 + 2 + 2 + "1" === "61", "Check + operator order");
  console.assert(2 + 5 + (2 + "00ab*") + 3 + 1 === "7200ab*31", "Check + operator order with brackets");

  console.assert('23' + [] === '23', "Check string + array");

  console.log([1,2,3].toString());
  console.assert([1, 2, 3] + "&&" === "1,2,3&&", "Check array + string");

  console.assert({} + "a" === "[object Object]a", "Check object + string");
  console.assert("a" + {e : 5} === "a[object Object]", "Check string + object");

  console.assert("123" + null === "123null", "Check string + null");
  console.assert(null + "" === "null", "Check null + string");

  console.assert("123" + undefined === "123undefined", "Check string + undefined");
  console.assert(undefined + "))" === "undefined))", "Check undefined + string");

  class B {
    e = 5;

    otherMethod(){
      return this.e;
    }
  }

  // TODO won't even compile. Need to fix TSN-441
  //let str = "" + B;
  // let str2 = B.toString();

  console.assert("" + new B() === "[object Object]", "Check string + class");
}

{
  const w1 = "5" + -"2";
  console.assert(w1 === "5-2", "String: 5+-2 case failed");

  const w2 = -"2";
  console.assert(w2 === -2, "String: -2 case failed");

  const w3 = "5" + -"asdasdas";
  console.assert(w3 === "5NaN", "String: 5NaN case failed");

  const w4 = "5" + -"";
  console.assert(w4 === "50", "String: empty string case failed");

  const w5 = "5" + -"   ";
  console.assert(w5 === "50", "String: spaces only case failed");

  const w6 = -"-2";
  console.assert(w6 === 2, "String: --2 case failed");

  const w7 = +-"5";
  console.assert(w7 === -5, "String: +-5 case failed");

  const w8 = -+"5";
  console.assert(w8 === -5, "String: -+5 case failed");

  const w9 = -+-"5";
  console.assert(w9 === 5, "String: -+-5 case failed");
}

{
  const s : string = "AB";
  console.assert(s[0] === "A", "String: operator[] 1");
  console.assert(s[1] === "B", "String: operator[] 2");
}

{
  let i = 0;
  const s : string = "AB";
  console.assert(s[i] === "A", "String: operator[]  with variable 1");
  i++;
  console.assert(s[i] === "B", "String: operator[]  with variable 2");
}

{
  let i = -1;
  const s : string = "AB";
  console.assert(s[i + 1] === "A", "String: operator[]  with variable 1");
  console.assert(s[i + 2] === "B", "String: operator[]  with variable 2");
}

{
  const s : string = "AB";
  for (let i = 0; i < s.length; i++) {
    if (i === 0) {
      console.assert(s[i] === "A", "String: for & operator[] 1");
    } else if (i === 1) {
      console.assert(s[i] === "B", "String: for & operator[] 2");
    }
  }
}

function testBasicCommaOperator() {
	let x = 1;
	x = x++, x;
	console.assert(x === 1, "comma (,) operator evaluates each of its operands (from left to right) and returns the value of the last operand");
}

testBasicCommaOperator();

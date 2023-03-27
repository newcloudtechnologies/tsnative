/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

function testBasicCommaOperator() {
	let x = 1;
	x = x++, x;
	console.assert(x === 1, "comma (,) operator evaluates each of its operands (from left to right) and returns the value of the last operand");
}

testBasicCommaOperator();

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

import { WithOptionalArgs } from "cpp_integration_exts"

let obj = new WithOptionalArgs(1);
console.assert(obj.getNumber() === 1 && obj.getString() === obj.getDefaultString(), "Ctor with optional args (1)");

obj = new WithOptionalArgs(22, "TEST");
console.assert(obj.getNumber() === 22 && obj.getString() === "TEST", "Ctor with optional args (2)");

obj.setValues(78);
console.assert(obj.getNumber() === 78 && obj.getString() === obj.getDefaultString(), "Method with optional args (1)");

obj.setValues(909, "Z");
console.assert(obj.getNumber() === 909 && obj.getString() === "Z", "Method with optional args (2)");

obj.setValues();
console.assert(obj.getNumber() === obj.getDefaultNumber() && obj.getString() === obj.getDefaultString(), "Method with optional args (3)");

{
    type ArgType = {
        a?: {
            b?: string
        }
    }

    type ExtendedArgType = ArgType &
    {
        text?: string,
    }

    function test(args: ExtendedArgType) {
        if (args.text) {
            obj.setString(args.text);
            console.assert(obj.getString() === args.text, "Optional field passed to CXX method");
        }

        if (args.a) {
            if (args.a.b) {
                obj.setString(args.a.b);
                console.assert(obj.getString() === args.a.b, "Nested optional field passed to CXX method");
            }
        }
    }

    test({ a: { b: "test1" }, text: "test2" });
}
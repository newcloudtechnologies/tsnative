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

// Optionals with rest
{
    const arr = [1, 2];
    const testObj = new WithOptionalArgs(22, "TEST");
    testObj.setMoreValues(33, "Str", 44, 55, ...arr);
    const items = testObj.getItems();

    console.assert(items[0] === 44, "Optional items[0] check failed");
    console.assert(items[1] === 55, "Optional items[1] check failed");
    console.assert(items[2] === 1, "Optional items[2] check failed");
    console.assert(items[3] === 2, "Optional items[3] check failed");
}
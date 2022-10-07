import { WithOptionalArgs } from "./declarations/cpp"

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

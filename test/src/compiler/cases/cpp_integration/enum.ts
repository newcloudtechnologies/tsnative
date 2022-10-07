import { E, EnumArgs } from "./declarations/cpp";

{
    const value = new EnumArgs(E.Auto);
    const bypass = value.test(E.Manual);

    console.assert(bypass === E.Manual, "Enum as CXX function argument/return");
}

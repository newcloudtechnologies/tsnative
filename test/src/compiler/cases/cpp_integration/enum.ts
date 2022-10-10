import { E, EnumArgs } from "./declarations/cpp";

{
    const value = new EnumArgs(E.Auto);
    const bypass = value.test(E.Manual);

    console.assert(bypass === E.Manual, "Enum as CXX function argument/return");

    function acceptsOptionalCXXEnum(alignment?: E) {
        if (alignment) {
            const bypassed = value.test(alignment);
            console.assert(bypassed === alignment, "Optional CXX-enum value must be correctly converted from TS");
        }
    }

    acceptsOptionalCXXEnum(E.Manual);
}

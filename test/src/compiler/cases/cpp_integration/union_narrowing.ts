import { UnionTest } from "cpp_integration_exts";

{
    const u: number | undefined = 3;

    const c = new UnionTest();

    if (u) {
        const v = c.bypass(u);
        console.assert(v === u, "Pass narrowed union to CXX method");
    } else {
        console.assert(false, "Never");
    }
}

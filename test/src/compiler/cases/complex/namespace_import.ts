import { A } from "./namespace_export"

console.assert(A.B.C.foo() === A.B.C.Enum.ENTRY1, "Namespace import failed");
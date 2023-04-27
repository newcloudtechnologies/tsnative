import { pointer } from "tsnative/std/definitions/lib.std.numeric"
import { VTable, VTableSize, VirtualDestructor, Virtual } from "tsnative/std/decorators/decorators"
import { TSClosure } from "tsnative/std/definitions/tsclosure"

//@ts-ignore
@Size(2)
//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class Entity {
    constructor();
    entity(): void;
}
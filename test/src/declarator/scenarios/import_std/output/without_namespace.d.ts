import { pointer } from "tsnative/std/definitions/lib.std.numeric"
import { VTable, VTableSize, VirtualDestructor, Virtual } from "tsnative/std/decorators/decorators"
import { TSClosure } from "tsnative/std/definitions/tsclosure"

//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class Entity {
    private p0_Entity: number;
    private p1_Entity: number;
    private p2_Entity: number;

    constructor();
    entity(): void;
}

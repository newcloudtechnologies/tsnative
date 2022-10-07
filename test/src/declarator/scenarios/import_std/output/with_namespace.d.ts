declare module "global" {
    import { pointer } from "tsnative/std/definitions/lib.std.numeric"
    import { VTable, VTableSize, VirtualDestructor, Virtual } from "tsnative/std/decorators/decorators"
    import { TSClosure } from "tsnative/std/definitions/tsclosure"

    export namespace stuffs {
        //@ts-ignore
        @VTableSize(8)
        //@ts-ignore
        @VirtualDestructor
        export class Entity {
            private p0_Entity: number;
            private p1_Entity: number;
            private p2_Entity: number;

            constructor();
            entity(): void;
        }
    }
}

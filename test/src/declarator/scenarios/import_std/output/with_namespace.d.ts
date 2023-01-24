declare module "global" {
    import { pointer } from "tsnative/std/definitions/lib.std.numeric"
    import { VTable, VTableSize, VirtualDestructor, Virtual } from "tsnative/std/decorators/decorators"
    import { TSClosure } from "tsnative/std/definitions/tsclosure"

    export namespace stuffs {
        //@ts-ignore
        @Size(3)
        //@ts-ignore
        @VTableSize(10)
        //@ts-ignore
        @VirtualDestructor
        export class Entity {
            constructor();
            entity(): void;
        }
    }
}
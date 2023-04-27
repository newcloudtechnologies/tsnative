declare module "global" {
    import { M1 } from "path/to/M1"
    import { M2 } from "path/to/M2"

    export namespace stuffs {
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
    }
}
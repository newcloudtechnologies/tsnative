declare module "global" {
    import { M1 } from "path/to/M1"
    import { M2 } from "path/to/M2"

    export namespace stuffs {
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
    }
}

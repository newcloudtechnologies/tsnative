declare module "global" {

    export namespace stuffs {
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Stuff extends entities.Entity {
            private p0_Stuff: number;
            private p1_Stuff: number;
            private p2_Stuff: number;
        }
    }
}

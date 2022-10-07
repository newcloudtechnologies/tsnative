declare module "test" {

    export namespace snippets {
        export namespace EnumHolder {
            enum Types {
                PLANT = 0,
                ANIMAL = 1,
                INSECT = 2,
            }
        }

        //@ts-ignore
        @VTableSize(8)
        //@ts-ignore
        @VirtualDestructor
        export class EnumHolder {
            private p0_EnumHolder: number;
            private p1_EnumHolder: number;
            private p2_EnumHolder: number;

            constructor();
            getType(): EnumHolder.Types;
        }
    }
}

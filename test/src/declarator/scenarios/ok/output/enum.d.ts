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
        @Size(3)
        //@ts-ignore
        @VTableSize(10)
        //@ts-ignore
        @VirtualDestructor
        export class EnumHolder {
            constructor();
            getType(): EnumHolder.Types;
        }
    }
}
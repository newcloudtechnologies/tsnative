declare module "global" {

    export namespace stuffs {
        //@ts-ignore
        @Size(2)
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Stuff extends entities.Entity {
        }
    }
}
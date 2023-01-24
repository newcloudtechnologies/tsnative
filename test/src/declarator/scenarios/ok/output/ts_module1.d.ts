declare module "global" {

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
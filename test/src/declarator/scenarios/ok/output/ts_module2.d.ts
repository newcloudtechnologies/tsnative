declare module "global" {

    export namespace stuffs1 {
        //@ts-ignore
        @Size(3)
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Entity1 {
            constructor();
            entity1(): void;
        }
    }

    export namespace stuffs2 {
        //@ts-ignore
        @Size(3)
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Entity2 {
            constructor();
            entity2(): void;
        }
    }
}
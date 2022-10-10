declare module "global" {

    export namespace stuffs1 {
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Entity1 {
            private p0_Entity1: number;
            private p1_Entity1: number;
            private p2_Entity1: number;

            constructor();
            entity1(): void;
        }
    }

    export namespace stuffs2 {
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Entity2 {
            private p0_Entity2: number;
            private p1_Entity2: number;
            private p2_Entity2: number;

            constructor();
            entity2(): void;
        }
    }
}

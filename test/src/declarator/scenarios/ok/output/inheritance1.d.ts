declare module "test" {

    export namespace snippets {
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Entity {
            private p0_Entity: number;
            private p1_Entity: number;
            private p2_Entity: number;

            entity(): void;
        }

        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Base extends Entity {
            private p0_Base: number;
            private p1_Base: number;
            private p2_Base: number;
            private p3_Base: number;

            base(): void;
        }

        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Derived extends Base {
            private p0_Derived: number;
            private p1_Derived: number;
            private p2_Derived: number;
            private p3_Derived: number;

            derived(): void;
        }
    }
}

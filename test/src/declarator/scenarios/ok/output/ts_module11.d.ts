declare module "mgtts" {

    export namespace ui2 {
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Entity_t {
            private p0_Entity_t: number;
            private p1_Entity_t: number;
            private p2_Entity_t: number;

            entity_base(): void;
        }

        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Base2_t {
            private p0_Base2_t: number;
            private p1_Base2_t: number;
            private p2_Base2_t: number;

            base(): void;
        }

        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Entity extends Entity_t {
            private p0_Entity: number;
            private p1_Entity: number;
            private p2_Entity: number;

            entity(): void;
        }

        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Derived2_t extends Base2_t {
            private p0_Derived2_t: number;
            private p1_Derived2_t: number;
            private p2_Derived2_t: number;

            derived(): void;
        }
    }
}

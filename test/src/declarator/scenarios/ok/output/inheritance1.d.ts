declare module "test" {

    export namespace snippets {
        //@ts-ignore
        @Size(2)
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Entity {
            entity(): void;
        }

        //@ts-ignore
        @Size(3)
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Base extends Entity {
            base(): void;
        }

        //@ts-ignore
        @Size(3)
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Derived extends Base {
            derived(): void;
        }
    }
}

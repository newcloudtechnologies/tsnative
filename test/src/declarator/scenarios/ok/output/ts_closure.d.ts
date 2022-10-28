declare module "global" {

    export namespace snippets {
        //@ts-ignore
        @Size(3)
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Widget {
            constructor(parent: Widget);
        }

        //@ts-ignore
        @Size(3)
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Button {
            constructor(parent: Widget);
            onClicked(closure: TSClosure): void;
        }
    }
}
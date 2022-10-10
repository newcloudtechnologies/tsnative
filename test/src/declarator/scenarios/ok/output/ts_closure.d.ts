declare module "global" {

    export namespace snippets {
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Widget {
            private p0_Widget: number;
            private p1_Widget: number;
            private p2_Widget: number;

            constructor(parent: Widget);
        }

        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Button {
            private p0_Button: number;
            private p1_Button: number;
            private p2_Button: number;

            constructor(parent: Widget);

            onClicked(slot: TSClosure): void;
        }
    }
}

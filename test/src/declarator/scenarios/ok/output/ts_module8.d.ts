declare module "poc" {

    export namespace exts {
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class MyWidget extends ts.Widget {
            private p0_MyWidget: number;
            private p1_MyWidget: number;
            private p2_MyWidget: number;

            constructor(parent: ts.Widget);
        }
    }
}

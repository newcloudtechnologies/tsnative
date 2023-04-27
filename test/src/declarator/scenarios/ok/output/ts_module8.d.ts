declare module "poc" {

    export namespace exts {
        //@ts-ignore
        @Size(2)
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class MyWidget extends ts.Widget {
            constructor(parent: ts.Widget);
        }
    }
}
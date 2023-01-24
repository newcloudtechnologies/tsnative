declare module "poc" {

    export namespace exts {
        //@ts-ignore
        @Size(3)
        //@ts-ignore
        @VTableSize(10)
        //@ts-ignore
        @VirtualDestructor
        export class MyWidget extends ts.Widget {
            constructor(parent: ts.Widget);
        }
    }
}
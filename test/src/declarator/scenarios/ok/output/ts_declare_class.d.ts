//@ts-ignore
@VTableSize(8)
//@ts-ignore
@VirtualDestructor
declare class MyOuterClass {
    private p0_MyOuterClass: number;
    private p1_MyOuterClass: number;
    private p2_MyOuterClass: number;

    constructor();
}

//@ts-ignore
@VTableSize(8)
//@ts-ignore
@VirtualDestructor
export declare class ExportAndDeclareClass {
    private p0_ExportAndDeclareClass: number;
    private p1_ExportAndDeclareClass: number;
    private p2_ExportAndDeclareClass: number;

    constructor();
}

declare namespace exts {
    //@ts-ignore
    @VTableSize(8)
    //@ts-ignore
    @VirtualDestructor
    declare class MyInnerClass {
        private p0_MyInnerClass: number;
        private p1_MyInnerClass: number;
        private p2_MyInnerClass: number;

        constructor();
    }
}

//@ts-ignore
@Size(3)
//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
declare class MyOuterClass {
    constructor();
}

//@ts-ignore
@Size(3)
//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export declare class ExportAndDeclareClass {
    constructor();
}

declare namespace exts {
    //@ts-ignore
    @Size(3)
    //@ts-ignore
    @VTableSize(9)
    //@ts-ignore
    @VirtualDestructor
    declare class MyInnerClass {
        constructor();
    }
}
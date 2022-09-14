/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 * 
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 * 
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 * 
 * This file is created automatically.
 * Don't edit this file.
*/

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
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
@VTableSize(6)
//@ts-ignore
@VirtualDestructor
declare class Boolean {
    private p0_Boolean: number;
    private p1_Boolean: number;
    private p2_Boolean: number;

    constructor(_: any);
    negate(): boolean;
    equals(other: boolean): boolean;
    clone(): boolean;
    toString(): string;
    toBool(): boolean;
    unboxed(): number;
}

// @ts-ignore
declare type boolean = Boolean;
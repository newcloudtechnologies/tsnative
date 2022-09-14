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
export class Collection {
    private p0_Collection: number;
    private p1_Collection: number;
    private p2_Collection: number;

    constructor();
    get capacity(): number;
    set capacity(value: number);
    get size(): number;
    set size(value: number);
}

//@ts-ignore
@VTableSize(8)
//@ts-ignore
@VirtualDestructor
export class Rope {
    private p0_Rope: number;
    private p1_Rope: number;
    private p2_Rope: number;

    constructor();
    get length(): number;
    set length(value: number);

    get values<U>(): U[];
    set values<U>(vals: U[]);
}
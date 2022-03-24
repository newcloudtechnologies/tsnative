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

export class Collection {
    private p0_Collection: boolean;

    constructor();
    get capacity(): number;
    set capacity(value: number);
}

export class Rope {
    private p0_Rope: boolean;

    constructor();
    get length(): number;
    set length(value: number);

    get values<U>(): U[];
    set values<U>(vals: U[]);
}
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
export class Event {
    private p0_Event: number;
    private p1_Event: number;
    private p2_Event: number;

    entity(): void;
    event(): void;
}

//@ts-ignore
@VTableSize(8)
//@ts-ignore
@VirtualDestructor
export class CustomEvent extends Event {
    private p0_CustomEvent: number;
    private p1_CustomEvent: number;
    private p2_CustomEvent: number;

    abc(): void;
    a(): void;
    ak(): void;
    al(): void;
    am(): void;
    b(): void;
    bk(): void;
    c(): void;
    ck(): void;
    cl(): void;
    de(): void;
    d(): void;
    e(): void;
    customEvent(): void;
}
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

// @ts-ignore
export type TSClosure = Function;

//@ts-ignore
@VTableSize(6)
//@ts-ignore
@VirtualDestructor
//@ts-ignore
export declare class TSClosure {
    private p0_TSClosure: number;
    private p1_TSClosure: number;
    private p2_TSClosure: number;
    private p3_TSClosure: number;
    private p4_TSClosure: number;
    private p5_TSClosure: number;

    constructor(fn: void, env: void, numArgs: number, optionals: number);
    getEnvironment(): void;
    //@ts-ignore
    @MapsTo("operator()()")
    call(): void;
    toString(): string;
}
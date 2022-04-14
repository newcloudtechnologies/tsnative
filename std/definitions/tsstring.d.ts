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
@VTableSize(10)
//@ts-ignore
@VirtualDestructor
declare class String extends Iterable<String> {
    private p0_String: number;

    constructor(initializer?: any);
    get length(): number;
    concat(other: string): string;
    startsWith(string: string, start?: number): boolean;
    endsWith(string: string, start?: number): boolean;
    split(pattern: string, limit?: number): string[];
    slice(start: number, end?: number): string;
    trim(): string;
    toLowerCase(): string;
    toUpperCase(): string;
    substring(start: number, end?: number): string;
    includes(pattern: string, start?: number): boolean;
    indexOf(pattern: string, start?: number): number;
    lastIndexOf(pattern: string, start?: number): number;
    equals(other: string): boolean;
    toString(): string;
    toBool(): boolean;
    clone(): string;

    //@ts-ignore
    @MapsTo("iterator")
    [Symbol.iterator](): StringIterator<string>;
}

// @ts-ignore
declare type string = String;
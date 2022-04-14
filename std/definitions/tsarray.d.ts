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

declare class Array<T> extends Iterable<T> {
    private p0_Array: number;

    constructor();
    push(...items: T[]): number;
    get length(): number;
    set length(value: number);
    forEach(callbackfn: (value: T, index: number, array: readonly T[]) => void): void;
    indexOf(searchElement: T, fromIndex?: number): number;
    splice(start: number, deleteCount?: number): T[];
    concat(other: T[]): T[];
    toString(): string;
    keys(): ArrayIterator<number>;
    values(): ArrayIterator<T>;

    map<U>(callbackfn: (value: T, index: number, array: readonly T[]) => U): U[];

    [index: number]: T;
    //@ts-ignore
    @MapsTo("iterator")
    [Symbol.iterator](): ArrayIterator<T>;
}

declare class ArrayIterator<T> extends IterableIterator<T> {
    private p0_ArrayIterator: number;
    private p1_ArrayIterator: number;

    next(): IteratorResult<T>;
}
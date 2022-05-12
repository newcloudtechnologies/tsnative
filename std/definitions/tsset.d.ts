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

declare class Set<T> extends Iterable<T> {
    private p0_Set: number;
    private p1_Set: number;
    private p2_Set: number;
    private p3_Set: number;

    constructor();
    has(value: T): boolean;
    add(value: T): this;
    //@ts-ignore
    @MapsTo("remove")
    delete(value: T): boolean;
    clear(): void;
    get size(): number;
    forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void): void;
    values(): ArrayIterator<T>;
    keys(): ArrayIterator<T>;
    toString(): string;

    //@ts-ignore
    @MapsTo("iterator")
    [Symbol.iterator](): SetIterator<T>;
}
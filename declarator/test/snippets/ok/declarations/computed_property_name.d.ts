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

export class IteratorResult<T> {
    private p0_IteratorResult: boolean;
}

export class Iterator<T> {
    private p0_Iterator: number;

    next(): IteratorResult<T>;
}

export class Iterable<T> {
    private p0_Iterable: number;

    iterator(): Iterator<T>;
}

export class Entity<T> extends Iterable<T> {
    constructor();

    //@ts-ignore
    @MapsTo("iterator")
    [Symbol.iterator](): EntityIterator<T>;
}
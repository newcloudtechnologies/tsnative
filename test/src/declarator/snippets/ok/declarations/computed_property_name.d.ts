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

declare module "global" {

    export namespace snippets {
        export class IteratorResult<T> {
            private p0_IteratorResult: number;
            private p1_IteratorResult: number;
            private p2_IteratorResult: number;
        }

        export class Iterator<T> {
            private p0_Iterator: number;
            private p1_Iterator: number;
            private p2_Iterator: number;

            next(): IteratorResult<T>;
        }

        export class Iterable<T> {
            private p0_Iterable: number;
            private p1_Iterable: number;
            private p2_Iterable: number;

            iterator(): Iterator<T>;
        }

        export class Entity<T> extends Iterable<T> {
            private p0_Entity: number;
            private p1_Entity: number;
            private p2_Entity: number;

            constructor();

            //@ts-ignore
            @MapsTo("iterator")
            [Symbol.iterator](): EntityIterator<T>;
        }
    }
}
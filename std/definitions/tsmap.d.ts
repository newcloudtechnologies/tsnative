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

declare class Map<K, V> extends Iterable<Tuple> {
    private p0_Map: number;
    private p1_Map: number;
    private p2_Map: number;
    private p3_Map: number;

    constructor();
    set(key: K, value: V): this;
    has(key: K): boolean;
    get(key: K): V;
    //@ts-ignore
    @MapsTo("remove")
    delete(key: K): boolean;
    clear(): void;
    get size(): number;
    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void;
    keys(): ArrayIterator<K>;
    values(): ArrayIterator<V>;
    toString(): string;

    //@ts-ignore
    @MapsTo("iterator")
    [Symbol.iterator](): MapIterator<[K, V]>;
}
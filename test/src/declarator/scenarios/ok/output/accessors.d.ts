//@ts-ignore
@Size(3)
//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class Collection {
    constructor();
    get capacity(): number;
    set capacity(value: number);
    get size(): number;
    set size(value: number);
}

//@ts-ignore
@Size(3)
//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class Rope {
    constructor();
    get length(): number;
    set length(value: number);

    get values<U>(): U[];
    set values<U>(vals: U[]);
}
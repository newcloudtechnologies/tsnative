//@ts-ignore
@VTableSize(8)
//@ts-ignore
@VirtualDestructor
export class Collection {
    private p0_Collection: number;
    private p1_Collection: number;
    private p2_Collection: number;

    constructor();
    get capacity(): number;
    set capacity(value: number);
    get size(): number;
    set size(value: number);
}

//@ts-ignore
@VTableSize(8)
//@ts-ignore
@VirtualDestructor
export class Rope {
    private p0_Rope: number;
    private p1_Rope: number;
    private p2_Rope: number;

    constructor();
    get length(): number;
    set length(value: number);

    get values<U>(): U[];
    set values<U>(vals: U[]);
}

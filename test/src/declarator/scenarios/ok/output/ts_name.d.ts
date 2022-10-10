enum Types {
    PLANT = 0,
    ANIMAL = 1,
    INSECT = 2,
}

//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class Collection {
    private p0_CollectionClass: number;
    private p1_CollectionClass: number;
    private p2_CollectionClass: number;

    constructor();
    size(): number;
}

export function getNumber(): number;

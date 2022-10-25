enum Types {
    PLANT = 0,
    ANIMAL = 1,
    INSECT = 2,
}

//@ts-ignore
@Size(3)
//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class Collection {
    constructor();
    size(): number;
}

export function getNumber(): number;
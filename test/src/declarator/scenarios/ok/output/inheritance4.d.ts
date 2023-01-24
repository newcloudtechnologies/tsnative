//@ts-ignore
@Size(3)
//@ts-ignore
@VTableSize(10)
//@ts-ignore
@VirtualDestructor
export class Entity {
    entity(): void;
}

//@ts-ignore
@Size(5)
//@ts-ignore
@VTableSize(10)
//@ts-ignore
@VirtualDestructor
export class Derived extends Entity {
    templateBase(): void;
    derived(): void;
}
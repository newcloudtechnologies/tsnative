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
@Size(3)
//@ts-ignore
@VTableSize(12)
//@ts-ignore
@VirtualDestructor
export class DerivedPointer extends Iterable<Entity> {
    derived_pointer(): void;
}
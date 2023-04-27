//@ts-ignore
@Size(2)
//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class Entity {
    entity(): void;
}

//@ts-ignore
@Size(2)
//@ts-ignore
@VTableSize(11)
//@ts-ignore
@VirtualDestructor
export class DerivedPointer extends Iterable<Entity> {
    derived_pointer(): void;
}

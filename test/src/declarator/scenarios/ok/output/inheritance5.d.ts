//@ts-ignore
@VTableSize(8)
//@ts-ignore
@VirtualDestructor
export class Entity {
    private p0_Entity: number;
    private p1_Entity: number;
    private p2_Entity: number;

    entity(): void;
}

//@ts-ignore
@VTableSize(10)
//@ts-ignore
@VirtualDestructor
export class DerivedPointer extends Iterable<Entity> {
    private p0_DerivedPointer: number;
    private p1_DerivedPointer: number;
    private p2_DerivedPointer: number;

    derived_pointer(): void;
}

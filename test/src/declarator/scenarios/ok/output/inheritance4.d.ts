//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class Entity {
    private p0_Entity: number;
    private p1_Entity: number;
    private p2_Entity: number;

    entity(): void;
}

//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class Derived extends Entity {
    private p0_Derived: number;
    private p1_Derived: number;
    private p2_Derived: number;
    private p3_Derived: number;
    private p4_Derived: number;

    templateBase(): void;
    derived(): void;
}
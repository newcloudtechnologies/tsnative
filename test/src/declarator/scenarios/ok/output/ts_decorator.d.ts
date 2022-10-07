//@ts-ignore
@NoFields
//@ts-ignore
@MapsTo("Pi", 3.14)
//@ts-ignore
@VTableSize(8)
//@ts-ignore
@VirtualDestructor
export class Entity {
    private p0_Entity: number;
    private p1_Entity: number;
    private p2_Entity: number;

    constructor();
    //@ts-ignore
    @Function(1, 2, "str", 3.14)
    //@ts-ignore
    @NoRet
    //@ts-ignore
    @MapsTo("iterator")
    update(): void;
}

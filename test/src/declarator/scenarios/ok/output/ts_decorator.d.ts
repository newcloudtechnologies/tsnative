//@ts-ignore
@NoFields
//@ts-ignore
@MapsTo("Pi", 3.14)
//@ts-ignore
@Size(3)
//@ts-ignore
@VTableSize(10)
//@ts-ignore
@VirtualDestructor
export class Entity {
    constructor();
    //@ts-ignore
    @Function(1, 2, "str", 3.14)
    //@ts-ignore
    @NoRet
    //@ts-ignore
    @MapsTo("iterator")
    update(): void;
}
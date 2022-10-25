//@ts-ignore
@Size(3)
//@ts-ignore
@VTableSize(11)
//@ts-ignore
@VirtualDestructor
export class WithVirtualMethods {
    constructor();
    //@ts-ignore
    @VTableIndex(7)
    methodOne(): void;
    methodTwo(): void;
    //@ts-ignore
    @VTableIndex(8)
    methodThree(): void;
}
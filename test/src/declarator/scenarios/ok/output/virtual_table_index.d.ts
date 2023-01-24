//@ts-ignore
@Size(3)
//@ts-ignore
@VTableSize(12)
//@ts-ignore
@VirtualDestructor
export class WithVirtualMethods {
    constructor();
    //@ts-ignore
    @VTableIndex(8)
    methodOne(): void;
    methodTwo(): void;
    //@ts-ignore
    @VTableIndex(9)
    methodThree(): void;
}
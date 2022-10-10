//@ts-ignore
@VTableSize(11)
//@ts-ignore
@VirtualDestructor
export class WithVirtualMethods {
    private p0_WithVirtualMethods: number;
    private p1_WithVirtualMethods: number;
    private p2_WithVirtualMethods: number;

    constructor();
    //@ts-ignore
    @VTableIndex(7)
    methodOne(): void;
    methodTwo(): void;
    //@ts-ignore
    @VTableIndex(8)
    methodThree(): void;
}
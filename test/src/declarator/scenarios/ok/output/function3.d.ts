//@ts-ignore
@VTableSize(8)
//@ts-ignore
@VirtualDestructor
export class Color {
    private p0_Color: number;
    private p1_Color: number;
    private p2_Color: number;
}

export function createRGB(r: number, g: number, b: number): Color;

export function createARGB(a: number, r: number, g: number, b: number): Color;

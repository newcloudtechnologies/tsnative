//@ts-ignore
@Size(2)
//@ts-ignore
@VTableSize(9)
//@ts-ignore
@VirtualDestructor
export class Color {
}

export function createRGB(r: number, g: number, b: number): Color;

export function createARGB(a: number, r: number, g: number, b: number): Color;

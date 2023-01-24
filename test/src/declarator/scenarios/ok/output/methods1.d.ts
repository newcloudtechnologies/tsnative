declare module "test" {

    export namespace snippets {
        //@ts-ignore
        @Size(3)
        //@ts-ignore
        @VTableSize(10)
        //@ts-ignore
        @VirtualDestructor
        export class Color {
            createRGB(r: number, g: number, b: number): Color;
            createARGB(a: number, r: number, g: number, b: number): Color;
        }

        //@ts-ignore
        @Size(3)
        //@ts-ignore
        @VTableSize(10)
        //@ts-ignore
        @VirtualDestructor
        export class Palette {
            constructor();
        }

        export function makePalette(colors: Array<Color>): Palette;
    }
}
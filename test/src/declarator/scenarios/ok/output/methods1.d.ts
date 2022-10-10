declare module "test" {

    export namespace snippets {
        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Color {
            private p0_Color: number;
            private p1_Color: number;
            private p2_Color: number;

            createRGB(r: number, g: number, b: number): Color;
            createARGB(a: number, r: number, g: number, b: number): Color;
        }

        //@ts-ignore
        @VTableSize(9)
        //@ts-ignore
        @VirtualDestructor
        export class Palette {
            private p0_Palette: number;
            private p1_Palette: number;
            private p2_Palette: number;

            constructor();
        }

        export function makePalette(colors: Array<Color>): Palette;
    }
}

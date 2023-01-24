declare module "test" {

    export namespace snippets {
        //@ts-ignore
        @Size(3)
        //@ts-ignore
        @VTableSize(10)
        //@ts-ignore
        @VirtualDestructor
        export class Color {
            static createRGB(r: number, g: number, b: number): Color;
            static createARGB(a: number, r: number, g: number, b: number): Color;
        }
    }
}
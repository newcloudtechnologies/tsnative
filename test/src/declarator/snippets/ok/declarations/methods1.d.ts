/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 * 
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 * 
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 * 
 * This file is created automatically.
 * Don't edit this file.
*/

declare module "test" {

    export namespace snippets {
        //@ts-ignore
        @VTableSize(8)
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
        @VTableSize(8)
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
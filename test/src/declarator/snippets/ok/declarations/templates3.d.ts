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

declare module "global" {

    export namespace snippets {
        export class TheCircle<T> {
            private p0_TheCircle: number;
            private p1_TheCircle: number;
            private p2_TheCircle: number;
            private p3_TheCircle: number;
            private p4_TheCircle: number;
            private p5_TheCircle: number;

            constructor(x: T, y: T, radius: T);
            x(): T;
            y(): T;
            radius(): T;
        }
    }
}
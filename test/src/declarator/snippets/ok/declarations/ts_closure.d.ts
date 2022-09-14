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
        //@ts-ignore
        @VTableSize(8)
        //@ts-ignore
        @VirtualDestructor
        export class Widget {
            private p0_Widget: number;
            private p1_Widget: number;
            private p2_Widget: number;

            constructor(parent: Widget);
        }

        //@ts-ignore
        @VTableSize(8)
        //@ts-ignore
        @VirtualDestructor
        export class Button {
            private p0_Button: number;
            private p1_Button: number;
            private p2_Button: number;

            constructor(parent: Widget);

            onClicked(slot: TSClosure): void;
        }
    }
}
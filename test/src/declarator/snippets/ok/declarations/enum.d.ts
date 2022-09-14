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
        export namespace EnumHolder {
            enum Types {
                PLANT = 0,
                ANIMAL = 1,
                INSECT = 2,
            }
        }

        //@ts-ignore
        @VTableSize(8)
        //@ts-ignore
        @VirtualDestructor
        export class EnumHolder {
            private p0_EnumHolder: number;
            private p1_EnumHolder: number;
            private p2_EnumHolder: number;

            constructor();
            getType(): EnumHolder.Types;
        }
    }
}
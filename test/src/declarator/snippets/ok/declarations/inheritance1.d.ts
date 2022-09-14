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
        export class Entity {
            private p0_Entity: number;
            private p1_Entity: number;
            private p2_Entity: number;

            entity(): void;
        }

        //@ts-ignore
        @VTableSize(8)
        //@ts-ignore
        @VirtualDestructor
        export class Base extends Entity {
            private p0_Base: number;
            private p1_Base: number;
            private p2_Base: number;
            private p3_Base: number;

            base(): void;
        }

        //@ts-ignore
        @VTableSize(8)
        //@ts-ignore
        @VirtualDestructor
        export class Derived extends Base {
            private p0_Derived: number;
            private p1_Derived: number;
            private p2_Derived: number;
            private p3_Derived: number;

            derived(): void;
        }
    }
}
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

declare module "mgtts" {

    export namespace ui2 {
        //@ts-ignore
        @VTableSize(8)
        //@ts-ignore
        @VirtualDestructor
        export class Entity_t {
            private p0_Entity_t: number;
            private p1_Entity_t: number;
            private p2_Entity_t: number;

            entity_base(): void;
        }

        //@ts-ignore
        @VTableSize(8)
        //@ts-ignore
        @VirtualDestructor
        export class Base2_t {
            private p0_Base2_t: number;
            private p1_Base2_t: number;
            private p2_Base2_t: number;

            base(): void;
        }

        //@ts-ignore
        @VTableSize(8)
        //@ts-ignore
        @VirtualDestructor
        export class Entity extends Entity_t {
            private p0_Entity: number;
            private p1_Entity: number;
            private p2_Entity: number;

            entity(): void;
        }

        //@ts-ignore
        @VTableSize(8)
        //@ts-ignore
        @VirtualDestructor
        export class Derived2_t extends Base2_t {
            private p0_Derived2_t: number;
            private p1_Derived2_t: number;
            private p2_Derived2_t: number;

            derived(): void;
        }
    }
}
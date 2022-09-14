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

    export namespace stuffs1 {
        //@ts-ignore
        @VTableSize(8)
        //@ts-ignore
        @VirtualDestructor
        export class Entity1 {
            private p0_Entity1: number;
            private p1_Entity1: number;
            private p2_Entity1: number;

            constructor();
            entity1(): void;
        }
    }

    export namespace stuffs2 {
        //@ts-ignore
        @VTableSize(8)
        //@ts-ignore
        @VirtualDestructor
        export class Entity2 {
            private p0_Entity2: number;
            private p1_Entity2: number;
            private p2_Entity2: number;

            constructor();
            entity2(): void;
        }
    }
}
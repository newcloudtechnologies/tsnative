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
    import { pointer } from "tsnative/std/definitions/lib.std.numeric"
    import { VTable, VTableSize, VirtualDestructor, Virtual } from "tsnative/std/decorators/decorators"
    import { TSClosure } from "tsnative/std/definitions/lib.std.utils"

    export namespace stuffs {
        export class Entity {
            private p0_Entity: boolean;

            constructor();
            entity(): void;
        }
    }
}
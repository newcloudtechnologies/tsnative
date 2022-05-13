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
    import { pointer } from "tsnative/std/definitions/lib.std.numeric"
    import { VTable, VTableSize, VirtualDestructor, Virtual } from "tsnative/std/decorators/decorators"
    import { TSClosure } from "tsnative/std/definitions/tsclosure"

    export namespace ui2 {
        export class Entity_t {
            private p0_Entity_t: boolean;

            entity_base(): void;
        }

        export class Base2_t {
            private p0_Base2_t: boolean;

            base(): void;
        }

        export class Entity extends Entity_t {
            private p0_Entity: boolean;

            entity(): void;
        }

        export class Derived2_t extends Base2_t {
            private p0_Derived2_t: boolean;

            derived(): void;
        }
    }
}
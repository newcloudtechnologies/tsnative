/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

declare module "mgt" {
    export namespace ts {
        export namespace Window {
            enum Type {
                Software = 0,
                OpenGL = 1,
                Vulkan = 2,
            }
        }

        export class Window { }
    }
}
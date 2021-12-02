/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2021
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
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

        export class Window {}
    }
}
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

{
    type FileInfo_t = {
        _type: string,
    }

    function lol(a: string, b: string, c: boolean): FileInfo_t {
        return {
            _type: c ? a : b,
        };
    }

    console.assert(lol("folder", "file", false)._type === "file" && lol("folder", "file", true)._type === "folder", "Object property initialized by ternary expression");
}

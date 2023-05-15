/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { Point } from "cpp_integration_exts";

{
    const coords = [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }];
    const points = coords.map((pos) => new Point(pos.x, pos.y));
    console.assert(points.length === 3, "Array.map return type")
}
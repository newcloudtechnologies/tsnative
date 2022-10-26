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

import { Button, Point } from "cpp_integration_exts";

const button = new Button();

let i = 0;
button.onClicked(() => ++i);
button.click();
console.assert(i === 1, "cpp closure test failed (1)");
button.click();
console.assert(i === 2, "cpp closure test failed (2)");

const point = new Point(1, 2);
button.onClickedWithPoint((point: Point) => {
    console.assert(point.x() === 1, "point x test failed");
    console.assert(point.y() === 2, "point y test failed");
})
button.clickWithPoint(point);
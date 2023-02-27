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

import { T } from "./other_class";

export namespace S {
    export enum RxMargins_e {
        Top = (1 << 0),
        Bottom = (1 << 3),
    }
}

export class Base {
    margins(m: S.RxMargins_e) {
        if (m & S.RxMargins_e.Top) {
            console.assert(true, "Expected Base.margins argument to be S.RxMargins_e.Top (1)");
        } else {
            console.assert(false, "Expected Base.margins argument to be S.RxMargins_e.Top (2)");
        }

        new T();
    }
}

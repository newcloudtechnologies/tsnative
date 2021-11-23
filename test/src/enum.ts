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

{
    enum Alignment {
        Horizontal,
        Vertical,
    }

    function bypass(value: Alignment) {
        return value;
    }

    console.assert(bypass(Alignment.Horizontal) === Alignment.Horizontal && bypass(Alignment.Vertical) === Alignment.Vertical, "Enum argument");
}

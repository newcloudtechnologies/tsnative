/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
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

{
    enum Margins_e {
        Top = (1 << 0),
        Left = (1 << 1),
        Right = (1 << 2),
        Bottom = (1 << 3),
    }

    function setMargin(edges: Margins_e) {
        return edges;
    }

    console.assert(setMargin(Margins_e.Left | Margins_e.Right) === ((1 << 1) | (1 << 2)), "Enum combination argument");
}

{
    enum Margins_e {
        Top = (1 << 0),
        Left = (1 << 1),
        Right = (1 << 2),
        Bottom = (1 << 3),
    }

    const edges = Margins_e.Top | Margins_e.Left
    if (edges & Margins_e.Top) {
        console.assert(true, "Never");
    } else {
        console.assert(false, "Enum check using '&'");
    }
}

{
    enum RxMargins_e {
        Top = (1 << 0),
        Left = (1 << 1),
        Right = (1 << 2),
        Bottom = (1 << 3),
    }

    function margins(edges: RxMargins_e) {
        return edges;
    }

    class Foo_t {
        margins2(edges: RxMargins_e) {
            return edges;
        }
    }

    const edges: RxMargins_e = RxMargins_e.Top | RxMargins_e.Right;

    console.assert(margins(edges) === ((1 << 0) | (1 << 2)), "Enum free function argument");
    console.assert(new Foo_t().margins2(edges) === ((1 << 0) | (1 << 2)), "Enum method argument");
}

{
    enum RxMargins_e {
        Top = 1,
        Right = 4,
    }

    class Foo_t {
        margins2(edges: RxMargins_e) {
            return edges;
        }
    }

    const edges: RxMargins_e = RxMargins_e.Top | RxMargins_e.Right;

    console.assert(new Foo_t().margins2(edges as number) === edges, "Enum cast to number");
}

{
    enum RxMargins_e {
        Top = 1,
        Right = 4,
    }

    class Foo_t {
        margins2(edges: number) {
            return edges;
        }
    }

    const edges: RxMargins_e = RxMargins_e.Top | RxMargins_e.Right;
    console.assert(new Foo_t().margins2(edges) === edges, "Implicit enum cast to number");
}

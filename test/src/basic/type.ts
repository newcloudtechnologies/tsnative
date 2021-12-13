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
    type FileInfo_t = {
        _name: string
        _type: string
    }

    const typeInitializer = "111";
    const nameInitializer = "Home";

    const item: FileInfo_t = { _type: typeInitializer, _name: nameInitializer };

    console.assert(item._name === nameInitializer, "Out-of-order type literal initialization (1)");
    console.assert(item._type === typeInitializer, "Out-of-order type literal initialization (2)");

    const itemList: FileInfo_t[] = [
        item
    ];

    console.assert(itemList[0]._name === nameInitializer, "Out-of-order type literal initialization (3)");
    console.assert(itemList[0]._type === typeInitializer, "Out-of-order type literal initialization (4)");
}

{
    type RxText_args2 = {
        text: string,
        color: number,
        font: (string | undefined)
    }

    {
        function RxText(args: RxText_args2) {
            if (args.font) {
                return true;
            }

            return false;
        }

        const positive = RxText({
            text: "string",
            color: 777,
            font: "Arial"
        });

        const negative = RxText({
            text: "string",
            color: 777,
            font: undefined
        });

        console.assert(positive === true, "Optional property (1)");
        console.assert(negative === false, "Optional property (2)");
    }

    {
        function RxText(args: RxText_args2) {
            if (args.font) {
                return args.font;
            }

            return "none";
        }

        const positive = RxText({
            text: "string",
            color: 777,
            font: "Arial"
        });

        const negative = RxText({
            text: "string",
            color: 777,
            font: undefined
        });

        console.assert(positive === "Arial", "Optional property (1)");
        console.assert(negative === "none", "Optional property (2)");
    }
}

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

        type RxText_args2 = {
            text: string,
            color: number,
            font: (string | undefined)
        }
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

{
    class FontBase {
        size: number = 5;
        family: string = "Times";
    }

    type RxText_args2 = {
        text: string,
        color: number,
        font: (FontBase | null)
    }

    function RxText(args: RxText_args2) {
        if (args.font) {
            return args.font;
        }

        return new FontBase;
    }

    const positive = RxText({
        text: "string",
        color: 777,
        font: {
            family: "Arial",
            size: 14,
        },
    });

    const negative = RxText({
        text: "string",
        color: 777,
        font: null,
    });

    console.assert(positive.family === "Arial" && positive.size === 14, "Class-typed optional property (1)");
    console.assert(negative.family === "Times" && negative.size === 5, "Class-typed optional property (2)");
}

{
    type Time_t = {
        msTime: number,
    }

    class MyClass {
        clickTime: Time_t | undefined;

        constructor() {
            this.clickTime = { msTime: 35 };
        }
    }

    const c = new MyClass();
    if (c.clickTime) {
        console.assert(c.clickTime.msTime === 35, "Type literal-typed optional property (1)");
    }

    c.clickTime = undefined;
    console.assert(!c.clickTime, "Type literal-typed optional property (2)");
}

{
    type MyType = {
        n?: number
    };

    function checkValue(arg: MyType) {
        if (arg.n !== undefined) {
            return true;
        }

        return;
    }

    const checkResult = checkValue({
        n: 3
    });

    console.assert(!!checkResult, "Type with optional field value in function args");
}

{
    type MultiValue = {
        w: string | number
    }

    const expected = 10;

    const a: MultiValue = {
        w: 10
    }
    console.assert(a.w === expected, "User type literal typed object with union property should be correctly initialized");

    {
        function f(v: MultiValue) {
            console.assert(v.w === expected, "User type literal typed object with union property should be correctly initialized (function argument)");
        }

        f({ w: expected });
    }

    {
        function f(): MultiValue {
            return {
                w: expected
            }
        }

        console.assert(f().w === expected, "User type literal typed object with union property should be correctly initialized (function return)");
    }
}

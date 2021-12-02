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

const isEqual = function <T>(a: T[], b: T[]): boolean {
    let result = false;

    if (a.length === b.length) {
        result = true;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                result = false;
                break;
            }
        }
    } else {
        result = false;
    }

    return result;
};

{
    const defaultValue = [1, 2, 3];
    const value = [5, 7, 9];

    function lol(args: number[] = defaultValue) {
        return args;
    }

    {
        const result = lol(value);
        console.assert(isEqual(result, value), "Function overloaded default parameter");
    }

    {
        const result = lol();
        console.assert(isEqual(result, defaultValue), "Function default parameter");
    }
}

{
    class MyBest {
        str: string

        constructor(val: string = "iha") {
            this.str = val;
        }

        setStr(val: string = "Default") {
            this.str = val;
        }
    }

    {
        const obj = new MyBest();
        console.assert(obj.str === "iha", "Constructor default parameter");
    }


    {
        const obj = new MyBest("My");
        console.assert(obj.str === "My", "Constructor overloaded default parameter");
    }

    {
        const obj = new MyBest;

        obj.setStr();
        console.assert(obj.str === "Default", "Method default parameter");

        obj.setStr("My string");
        console.assert(obj.str === "My string", "Method overloaded default parameter");
    }
}

{
    interface RxSize {
        w: number,
        h: number,
    }

    interface RxZStack_args {
        size: RxSize,
    }

    class RxWidget {
        str: string = "lol"
    }

    class RxZStack {
        static c(args: RxZStack_args, children: RxWidget[] = []) {
            return { w: args.size.w, h: args.size.h, c: children };
        }
    }

    {
        const children =  [
            new RxWidget(),
            new RxWidget()
        ];

        const value = RxZStack.c({
            size: { w: 555, h: 444 },
        }, children);

        console.assert(value.w === 555 && value.h === 444 && isEqual(value.c, children), "Static method overloaded default parameter");
    }

    {
        const value = RxZStack.c({
            size: { w: 12, h: 24 }
        });

        console.assert(value.w === 12 && value.h === 24 && isEqual(value.c, []), "Static method default parameter");
    }
}

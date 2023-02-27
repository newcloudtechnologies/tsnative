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
{
    function f<T>(v: T) {
        console.log(v);
    }

    f(1);
    f("1");
}

namespace Stack {
    export function fillV(...ns: number[]) {
        return ns;
    }
}

{
    function ForEach<E, W>(model: Array<E>, callback: (element: E, index: number) => W): Array<W> {
        return model.map(callback);
    }

    class C {
        _model = [1, 2, 3];

        render() {
            return [...Stack.fillV(
                ...ForEach(this._model, (n: number, index: number) => { return n * (index + 1); }),
            )];
        }
    }

    const expected = [1, 4, 9];

    const is_equal = function (a: number[], b: number[]): boolean {
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

    console.assert(is_equal(new C().render(), expected), "Array template method in generic function failed");
}

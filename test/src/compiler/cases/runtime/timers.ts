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
    // Clearing the timer by calling clearTimeout after the condition
    let count = 0;

    const id = setInterval(() => {
        if (count === 5) {
            setTimeout(() => {
                console.assert(count === 5);
            }, 0)
            clearInterval(id);
            return;
        }
        count = count + 1;
    }, 0);

    console.assert(count === 0, "EventLoop. Clearing the timer by calling clearTimeout after the condition. Assert: eval does not blocking")
}

{
    let num = 0;

    const foo = (): void => {
        num = 33;
        console.assert(num === 33, "EventLoop. Value is not equal 33");
    }
    const id = setTimeout(foo, 0);
    console.assert(num !== 33);
}

{
    let c = 0;

    const f = (a: number, b: number): void => {
        setTimeout(() => {
            console.assert(c === 3, "EventLoop. Make async function expects a value equal 3");

        }, 0);
        c = a + b;
    }

    setTimeout(f.bind(null, 1, 2), 0);

    console.assert(c === 0);
}

{
    setTimeout(() => {
        const id = setTimeout(() => {
            console.assert(false, "EventLoop. Clearing time out. Assert: Do nothing");
        }, 0);
        clearTimeout(id);
        setTimeout(() => {
        }, 5);
    }, 0);
}

{
    let i = 0;
    const f = () => {
        if (i === 5) {
            return;
        }
        ++i;
        setTimeout(f, 0);
        console.assert(i <= 5, "EventLoop. Recursive call. Assert: i cannot be more than 5");
    }
    f();
}

/*
FIXME: (AN-926): link error on Windows: undefined reference to `__gxx_personality_v0'
{
    const f = (i: number): number | never => {
        if (i === 1) throw 23;
        return i;
    };
    const o = (i: number): number => {
        try {
            return ((): number => f(i))();
        } catch (e) {
            return e;
        }
    };

    setTimeout(() => {
        console.assert(o(1) === 23 && o(2) === 2, "EventLoop. Check exception handling. Assert: mismatch");
    }, 0);
}
*/

let count = 0;
{
    const f = () => {
        setTimeout(() => {
            ++count;
            setTimeout(() => {
                ++count;
                setTimeout(() => {
                    ++count;
                    console.assert(count === 3, "EventLoop. the number of timeout calls must be 3")
                }, 0);
            }, 0)
        }, 0);
    }
    f();
}

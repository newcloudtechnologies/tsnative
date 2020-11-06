{
    const listener0 = function () {
        return 0;
    }

    const listener1 = function () {
        return 1;
    }

    const f = function () {
        let listeners: (() => number)[] = [listener0];

        return {
            dispatch: function (): void {
                listeners.forEach((listener: () => number, index: number): void => {
                    const v = listener();
                    console.assert(v === index, "Function expressions as object fields test failed");
                });
            },
            subscribe: function subscribe(listener: () => number) {
                listeners.push(listener);
            }
        }
    }

    const ff = f();
    ff.subscribe(listener1);
    ff.dispatch();
}

{
    function fz() {
        let z = 9119;
        return function fn(_: () => void) {
            return z;
        }
    }

    const ffz = fz();
    const z = ffz(() => { });
    console.assert(z === 9119, "Function expression with funarg in return failed");
}
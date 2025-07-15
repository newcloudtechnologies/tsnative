type VoidFunction = () => void;
function once2(fn: VoidFunction | null): VoidFunction {
    return (): void => {
        if (fn) {
            fn(); //! @todo apply contexts?
            fn = null;
        }
    }
}

export default function createStore2() {
    let callCounter = 0;

    let lol = once2((): void => {
        ++callCounter;
    });

    lol();
    lol();

    console.assert(callCounter === 1, "Call once");
}
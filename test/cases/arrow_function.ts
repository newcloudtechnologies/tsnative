{
    const f = (): void => { };
    f();
}

{
    const f = (_: number): void => { };
    f(12);
}

{
    const f = (v: number): number => { return v; };
    f(12);
}

{
    const f = (v: number, u: number): number => { return v + u; };
    f(12, 1);
}

{
    const f = (u: string): string => { return u; };
    f("h");
}

{
    const f = (fn: (_: number) => void, v: number) => {
        fn(v);
    };

    const log = (v: number): void => {
        console.log(v);
    }

    f(log, 22);
}

{
    const f = () => {
        return function() {
            console.log(22)
        }
     };
    f()();
}
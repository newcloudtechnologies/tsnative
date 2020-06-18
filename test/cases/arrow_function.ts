{
    let f = (): void => { };
    f();
}

{
    let f = (_: number): void => { };
    f(12);
}

{
    let f = (v: number): number => { return v; };
    f(12);
}

{
    let f = (v: number, u: number): number => { return v + u; };
    f(12, 1);
}

{
    let f = (u: string): string => { return u; };
    f("h");
}

{
    let f = (fn: (_: number) => void, v: number) => {
        fn(v);
    };

    let log = (v: number): void => {
        console.log(v);
    }

    f(log, 22);
}

{
    let f = () => {
        return function() {
            console.log(22)
        }
     };
    f()();
}
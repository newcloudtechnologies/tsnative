// @ts-ignore
export type TSClosure = Function;

// @ts-ignore
export declare class TSClosure {
    constructor(
        fn: void,
        env: void,
        numArgs: number,
        optionals: number
    );

    // @ts-ignore
    @MapsTo("operator()()")
    call(): void;

    getEnvironment(): void;
}

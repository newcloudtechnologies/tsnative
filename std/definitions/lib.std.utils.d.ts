// @ts-ignore
export type TSClosure = Function;

// @ts-ignore
export declare class TSClosure {
    constructor(
        fn: any,
        env: any,
        numArgs: number,
        optionals: number
    );

    // @ts-ignore
    @MapsTo("operator()()")
    call(): any;

    getEnvironment(): any;
}

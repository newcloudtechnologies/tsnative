import { int32_t, int64_t, uint32_t } from "./lib.std.numeric"

// @ts-ignore
export type TSClosure = Function;

// @ts-ignore
export declare class TSClosure {
    constructor(
        fn: void,
        env: void,
        numArgs: int32_t,
        optionals: int64_t
    );

    // @ts-ignore
    @MapsTo("operator()()")
    call(): void;

    getEnvironment(): void;
}

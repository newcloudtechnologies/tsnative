import { int32_t, int64_t, uint32_t } from "./lib.std.numeric"

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

export declare class SizeOf {
    static array(): uint32_t;
    static string(): uint32_t;
    static closure(): uint32_t;
}

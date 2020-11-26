// @ts-nocheck

export class SmallPod16 {
    constructor();

    getValue(): int16_t;

    private _: int16_t;
}

export class SmallPod32 {
    constructor();

    getValue(): int32_t;

    private _: int32_t;
}

@VTable
export class SmallWithVirtualDestructor {
    constructor();

    getValue(): int16_t;

    private _: int16_t;
}

@Unaligned
export class SmallUnaligned {
    constructor();

    getValue(): int16_t;

    private _1: int16_t;
    private _2: int8_t;
    private _3: int8_t;
    private _4: int8_t;
}

export class Large {
    constructor();

    getValue(): int64_t;

    private _1: int64_t;
    private _2: int64_t;
    private _3: int64_t;
    private _4: int64_t;
    private _5: int64_t;
    private _6: int64_t;
    private _7: int64_t;
    private _8: int64_t;
    private _9: int8_t;
}

export class ValueReturner {
    constructor();

    @ReturnsValueType
    getSmallPod16(): SmallPod16;
    @ReturnsValueType
    getSmallPod32(): SmallPod32;

    @ReturnsValueType
    getSmallWithVirtualDestructor(): SmallWithVirtualDestructor;
    @ReturnsValueType
    getSmallUnaligned(): SmallUnaligned;
    @ReturnsValueType
    getLarge(): Large;
}

// @ts-nocheck

declare module "cpp" {
    export class Aggregate {
        constructor(point: Point,
            array: string[],
            s: string, d: number, i: int8_t);

        @ReturnsValueType
        getPoint(): Point;
        @ReturnsValueType
        getStringArray(): string[];
        @ReturnsValueType
        getString(): string;

        getDouble(): number;
        getInt8(): int8_t;

        @ValueType
        private point: Point;
        @ValueType
        private array: string[];
        @ValueType
        private s: string;
        @ValueType
        private d: number;
        private i: int8_t;
    }
}

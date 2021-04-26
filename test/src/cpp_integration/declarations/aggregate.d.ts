// @ts-nocheck

declare module "cpp" {
    export class Aggregate {
        constructor(point: Point,
            array: string[],
            s: string, d: number, i: int8_t);

        getPoint(): Point;
        getStringArray(): string[];
        getString(): string;

        getDouble(): number;
        getInt8(): int8_t;

        private point: Point;
        private array: string[];
        private s: string;
        @ValueType
        private d: number;
        private i: int8_t;
    }
}

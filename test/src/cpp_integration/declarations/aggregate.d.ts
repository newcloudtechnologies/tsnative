declare module "cpp" {
    import { ValueType } from "std/decorators/decorators";
    import { int8_t } from "std/definitions/lib.std.numeric";

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

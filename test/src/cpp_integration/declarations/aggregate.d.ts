declare module "cpp" {
    import { ValueType } from "std/decorators/decorators";

    export class Aggregate {
        constructor(point: Point,
            array: string[],
            s: string, d: number);

        getPoint(): Point;
        getStringArray(): string[];
        getString(): string;

        getDouble(): number;

        private point: Point;
        private array: string[];
        private s: string;
        @ValueType
        private d: number;
    }
}

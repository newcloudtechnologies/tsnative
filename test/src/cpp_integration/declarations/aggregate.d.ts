declare module "cpp" {
    import { ValueType } from "std/decorators/decorators";

    export class Aggregate {
        constructor(point: Point,
            array: string[],
            s: string, n: number);

        getPoint(): Point;
        getStringArray(): string[];
        getString(): string;

        getNumber(): number;

        private point: Point;
        private array: string[];
        private s: string;
        @ValueType
        private n: number;
    }
}

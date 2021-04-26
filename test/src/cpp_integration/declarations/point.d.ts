declare module "cpp" {
    import { ValueType } from "std-typescript-llvm/decorators/decorators"

    export class Point {
        constructor(x: number, y: number);

        x(): number;
        y(): number;

        setX(x: number): void;
        setY(y: number): void;

        clone(): Point;

        @ValueType
        private x_: number;
        @ValueType
        private y_: number;
    }
}
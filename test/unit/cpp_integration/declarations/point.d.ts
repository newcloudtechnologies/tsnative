// @ts-nocheck

declare module "cpp" {
    export class Point {
        constructor(x: number, y: number);

        x(): number;
        y(): number;

        setX(x: number): void;
        setY(y: number): void;

        @ReturnsValueType
        clone(): Point;

        @ValueType
        private x_: number;
        @ValueType
        private y_: number;
    }
}
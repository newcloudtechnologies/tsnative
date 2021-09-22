declare module "cpp" {
    import { ValueType } from "std/decorators/decorators";

    export class Rect {
        constructor(topLeft: Point, bottomRight: Point);

        getSquare(): number;

        @ValueType
        private topLeft: Point;
        @ValueType
        private bottomRight: Point;
    }
}
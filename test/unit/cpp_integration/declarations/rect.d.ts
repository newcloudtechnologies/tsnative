// @ts-nocheck

declare module "cpp" {
    @NonPod
    export class Rect {
        constructor(topLeft: Point, bottomRight: Point);

        getSquare(): number;

        @ValueType
        private topLeft: Point;
        @ValueType
        private bottomRight: Point;
    }
}
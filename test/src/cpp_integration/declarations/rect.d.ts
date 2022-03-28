declare module "cpp" {
    export class Rect {
        constructor(topLeft: Point, bottomRight: Point);

        getSquare(): number;

        getDiagonal(): Point[];

        private p0: number;
        private p1: number;
    }
}
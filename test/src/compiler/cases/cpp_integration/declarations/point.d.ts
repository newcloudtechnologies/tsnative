declare module "cpp" {
    export class Point {
        constructor(x: number, y: number);

        x(): number;
        y(): number;

        setX(x: number): void;
        setY(y: number): void;

        clone(): Point;

        private p0: number;
        private p1: number;
        private p2: number;
    }
}
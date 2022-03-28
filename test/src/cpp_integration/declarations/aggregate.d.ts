declare module "cpp" {
    export class Aggregate {
        constructor(point: Point,
            array: string[],
            s: string, n: number);

        getPoint(): Point;
        getStringArray(): string[];
        getString(): string;

        getNumber(): number;

        private p0: number;
        private p1: number;
    }

    export class LargerAggregate {
        constructor(x1: number, y1: number, x2: number, y2: number);

        getTopLeft(): Point;
        getBottomRight(): Point;

        getRect(): Rect;

        getScaled(factor: number): this;

        private p0: number;
        private p1: number;
    }
}

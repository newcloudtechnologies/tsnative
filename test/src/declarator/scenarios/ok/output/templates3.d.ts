declare module "global" {

    export namespace snippets {
        export class TheCircle<T> {
            private p0_TheCircle: number;
            private p1_TheCircle: number;
            private p2_TheCircle: number;
            private p3_TheCircle: number;
            private p4_TheCircle: number;
            private p5_TheCircle: number;

            constructor(x: T, y: T, radius: T);
            x(): T;
            y(): T;
            radius(): T;
        }
    }
}

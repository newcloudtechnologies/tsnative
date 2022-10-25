declare module "global" {

    export namespace snippets {
        //@ts-ignore
        @Size(6)
        export class TheCircle<T> {
            constructor(x: T, y: T, radius: T);
            x(): T;
            y(): T;
            radius(): T;
        }
    }
}
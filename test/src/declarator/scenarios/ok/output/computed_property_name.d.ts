declare module "global" {

    export namespace snippets {
        export class IteratorResult<T> {
            private p0_IteratorResult: number;
            private p1_IteratorResult: number;
            private p2_IteratorResult: number;
        }

        export class Iterator<T> {
            private p0_Iterator: number;
            private p1_Iterator: number;
            private p2_Iterator: number;

            next(): IteratorResult<T>;
        }

        export class Iterable<T> {
            private p0_Iterable: number;
            private p1_Iterable: number;
            private p2_Iterable: number;

            iterator(): Iterator<T>;
        }

        export class Entity<T> extends Iterable<T> {
            private p0_Entity: number;
            private p1_Entity: number;
            private p2_Entity: number;

            constructor();

            //@ts-ignore
            @MapsTo("iterator")
            [Symbol.iterator](): EntityIterator<T>;
        }
    }
}

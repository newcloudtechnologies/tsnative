declare module "global" {

    export namespace snippets {
        //@ts-ignore
        @Size(3)
        export class IteratorResult<T> {
        }

        //@ts-ignore
        @Size(3)
        export class Iterator<T> {
            //@ts-ignore
            @VTableIndex(8)
            next(): IteratorResult<T>;
        }

        //@ts-ignore
        @Size(3)
        export class Iterable<T> {
            //@ts-ignore
            @VTableIndex(8)
            iterator(): Iterator<T>;
        }

        //@ts-ignore
        @Size(3)
        export class Entity<T> extends Iterable<T> {
            constructor();

            //@ts-ignore
            @MapsTo("iterator")
            [Symbol.iterator](): EntityIterator<T>;
        }
    }
}
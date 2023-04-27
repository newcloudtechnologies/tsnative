declare module "global" {

    export namespace snippets {
        //@ts-ignore
        @Size(2)
        export class IndexableEntity<T> {
            constructor();

            [index: number]: T;
        }
    }
}
declare module "global" {

    export namespace snippets {
        //@ts-ignore
        @Size(3)
        export class IndexableEntity<T> {
            constructor();

            [index: number]: T;
        }
    }
}
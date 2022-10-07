declare module "global" {

    export namespace snippets {
        export class IndexableEntity<T> {
            private p0_IndexableEntity: number;
            private p1_IndexableEntity: number;
            private p2_IndexableEntity: number;

            constructor();

            [index: number]: T;
        }
    }
}

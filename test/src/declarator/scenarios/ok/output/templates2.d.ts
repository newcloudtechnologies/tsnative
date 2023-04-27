declare module "global" {

    export namespace snippets {
        //@ts-ignore
        @Size(5)
        export class MultiparamClassTemplate<X, Y, Z> {
            constructor();
        }
    }
}

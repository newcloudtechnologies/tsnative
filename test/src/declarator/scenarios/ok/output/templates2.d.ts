declare module "global" {

    export namespace snippets {
        //@ts-ignore
        @Size(6)
        export class MultiparamClassTemplate<X, Y, Z> {
            constructor();
        }
    }
}
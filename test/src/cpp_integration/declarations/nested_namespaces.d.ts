declare module "N1" {
    export namespace N2 {
        export class Clazz {
            constructor();

            private p0: number;
            private p1: number;
        }

        export function takesClazz(_: Clazz): void;
    }
}
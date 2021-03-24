declare module "N1" {
    export namespace N2 {
        export class Clazz {
            constructor();
        }

        export function takesClazz(_: Clazz): void;
    }
}
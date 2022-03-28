declare module "cpp" {
    export class WithOptionalArgs {
        constructor(n: number, s?: string);

        setValues(n?: number, s?: string): void;

        getNumber(): number;
        getString(): string;

        getDefaultNumber(): number;
        getDefaultString(): string;

        private p0: number;
        private p1: number;
    }
}

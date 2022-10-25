declare module "cpp" {
    //@ts-ignore
    @Size(3)
    export class WithOptionalArgs {
        constructor(n: number, s?: string);

        setValues(n?: number, s?: string): void;

        getNumber(): number;
        getString(): string;

        getDefaultNumber(): number;
        getDefaultString(): string;
    }
}

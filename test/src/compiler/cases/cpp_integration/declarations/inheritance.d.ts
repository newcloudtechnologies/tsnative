/// <reference path="dummy_base.d.ts" />

declare module "cpp" {
    import { VTable } from "tsnative/std/decorators/decorators";

    import { Base } from "test";

    @VTable
    //@ts-ignore
    @Size(4)
    export class VirtualBase {
        constructor();

        virtualMethod(): string;
        pureVirtualMethodToOverride(): number;

        private _s: string;
    }

    @VTable
    //@ts-ignore
    @Size(5)
    export class DerivedFromVirtualBase extends VirtualBase {
        constructor();

        pureVirtualMethodToOverride(): number;

        private _i: number;
    }

    //@ts-ignore
    @Size(3)
    export class DerivedFromBaseInOtherNamespace implements Base {
        constructor();

        test(): void;
    }

    //@ts-ignore
    @Size(5)
    export class CXXBase {
        constructor();

        getNumber(): number;
        callMemberClosure(): string;
    }
}

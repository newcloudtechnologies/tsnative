/// <reference path="dummy_base.d.ts" />

declare module "cpp" {
    import { VTable } from "tsnative/std/decorators/decorators";

    import { Base } from "test";

    @VTable
    export class VirtualBase {
        constructor();

        virtualMethod(): string;
        pureVirtualMethodToOverride(): number;

        private _s: string;

        private p0: number;
        private p1: number;
        private p2: number;
    }

    @VTable
    export class DerivedFromVirtualBase extends VirtualBase {
        constructor();

        pureVirtualMethodToOverride(): number;

        private _i: number;
    }

    export class DerivedFromBaseInOtherNamespace implements Base {
        constructor();

        test(): void;
        
        private p0: number;
        private p1: number;
    }

    export class CXXBase {
        constructor();

        getNumber(): number;
        callMemberClosure(): string;

        private p0: number;
        private p1: number;
        private p2: number;
        private p3: number;
        private p4: number;
    }
}

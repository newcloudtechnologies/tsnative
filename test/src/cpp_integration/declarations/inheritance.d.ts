// @ts-nocheck

/// <reference path="dummy_base.d.ts" />

declare module "cpp" {

    import { Base } from "test";

    export interface PointPair {
        getTopLeft(): Point;
        getBottomRight(): Point;
    }

    export interface RectHolder {
        getRect(): Rect;
    }

    export class PointPair {
        constructor(x1: number, y1: number, x2: number, y2: number);

        getTopLeft(): Point;
        getBottomRight(): Point;

        @ValueType
        private topLeft: Point;
        @ValueType
        private bottomRight: Point;
    }

    export class RectHolder {
        constructor(rect: Rect);

        getRect(): Rect;

        @ValueType
        private rect: Rect;
    }

    export class Mixin implements PointPair, RectHolder {
        constructor(x1: number, y1: number, x2: number, y2: number);

        getTopLeft(): Point;
        getBottomRight(): Point;

        getRect(): Rect;

        getScaled(factor: number): this;
    }

    export interface VirtualBase {
        virtualMethod(): string;
        pureVirtualMethodToOverride(): int32_t;
    }

    @VTable
    export class VirtualBase {
        constructor();

        virtualMethod(): string;
        pureVirtualMethodToOverride(): int32_t;

        @ValueType
        private _s: string;
    }

    @VTable
    export class DerivedFromVirtualBase implements VirtualBase {
        constructor();

        virtualMethod(): string;
        pureVirtualMethodToOverride(): int32_t;

        private _i: int32_t;
    }

    export class DerivedFromBaseInOtherNamespace implements Base {
        constructor();

        test(): void;
    }
}

// @ts-nocheck

/// <reference path="dummy_base.d.ts" />

declare module "cpp" {

    import { Base } from "test";

    export declare interface PointPair {
        getTopLeft(): Point;
        getBottomRight(): Point;
    }

    export declare interface RectHolder {
        getRect(): Rect;
    }

    export declare class PointPair {
        constructor(x1: number, y1: number, x2: number, y2: number);

        @ReturnsValueType
        getTopLeft(): Point;
        @ReturnsValueType
        getBottomRight(): Point;

        @ValueType
        private topLeft: Point;
        @ValueType
        private bottomRight: Point;
    }

    export declare class RectHolder {
        constructor(rect: Rect);

        @ReturnsValueType
        getRect(): Rect;

        @ValueType
        private rect: Rect;
    }

    export declare class Mixin implements PointPair, RectHolder {
        constructor(x1: number, y1: number, x2: number, y2: number);

        @ReturnsValueType
        getTopLeft(): Point;
        @ReturnsValueType
        getBottomRight(): Point;

        @ReturnsValueType
        getRect(): Rect;

        @ReturnsValueType
        getScaled(factor: number): this;
    }

    export declare interface VirtualBase {
        virtualMethod(): string;
        pureVirtualMethodToOverride(): int32_t;
    }

    @VTable
    export declare class VirtualBase {
        constructor();

        @ReturnsValueType
        virtualMethod(): string;
        pureVirtualMethodToOverride(): int32_t;

        @ValueType
        private _s: string;
    }

    @VTable
    export declare class DerivedFromVirtualBase implements VirtualBase {
        constructor();

        @ReturnsValueType
        virtualMethod(): string;
        pureVirtualMethodToOverride(): int32_t;

        private _i: int32_t;
    }

    export declare class DerivedFromBaseInOtherNamespace implements Base {
        constructor();

        test(): void;
    }
}

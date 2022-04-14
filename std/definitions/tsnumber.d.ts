/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 * 
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 * 
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 * 
 * This file is created automatically.
 * Don't edit this file.
*/

//@ts-ignore
@VTableSize(6)
//@ts-ignore
@VirtualDestructor
declare class Number {
    private p0_Number: number;

    constructor(_: any);
    add(other: number): number;
    sub(other: number): number;
    mul(other: number): number;
    div(other: number): number;
    mod(other: number): number;
    addInplace(other: number): number;
    subInplace(other: number): number;
    mulInplace(other: number): number;
    divInplace(other: number): number;
    modInplace(other: number): number;
    negate(): number;
    prefixIncrement(): number;
    postfixIncrement(): number;
    prefixDecrement(): number;
    postfixDecrement(): number;
    bitwiseAnd(other: number): number;
    bitwiseOr(other: number): number;
    bitwiseXor(other: number): number;
    bitwiseLeftShift(other: number): number;
    bitwiseRightShift(other: number): number;
    bitwiseAndInplace(other: number): number;
    bitwiseOrInplace(other: number): number;
    bitwiseXorInplace(other: number): number;
    bitwiseLeftShiftInplace(other: number): number;
    bitwiseRightShiftInplace(other: number): number;
    equals(other: number): boolean;
    lessThan(other: number): boolean;
    lessEqualsThan(other: number): boolean;
    greaterThan(other: number): boolean;
    greaterEqualsThan(other: number): boolean;
    toString(): string;
    toBool(): boolean;
    unboxed(): number;
    clone(): number;
}

// @ts-ignore
declare type number = Number;
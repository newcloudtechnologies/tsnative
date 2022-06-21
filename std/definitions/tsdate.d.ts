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
@VTableSize(7)
//@ts-ignore
@VirtualDestructor
declare class Date {
    private p0_Date: number;
    private p1_Date: number;
    private p2_Date: number;

    static parse(date_string: string): number;
    static now(): number;
    static UTC(year: number, month: number, day?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number): number;
    constructor();
    constructor(dateString: string);
    constructor(msSinceEpoch: number);
    constructor(year: number, month: number, day?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number);
    getDate(): number;
    getDay(): number;
    getFullYear(): number;
    getHours(): number;
    getMilliseconds(): number;
    getMinutes(): number;
    getMonth(): number;
    getSeconds(): number;
    getTime(): number;
    getTimezoneOffset(): number;
    getUTCDate(): number;
    getUTCDay(): number;
    getUTCFullYear(): number;
    getUTCHours(): number;
    getUTCMilliseconds(): number;
    getUTCMinutes(): number;
    getUTCMonth(): number;
    getUTCSeconds(): number;
    setFullYear(year: number, month?: number, day?: number): number;
    setMonth(month: number, day?: number): number;
    setDate(new_date: number): number;
    setHours(hours: number, minutes?: number, seconds?: number, milliseconds?: number): number;
    setMinutes(minutes: number, seconds?: number, milliseconds?: number): number;
    setSeconds(seconds: number, milliseconds?: number): number;
    setMilliseconds(new_milliseconds: number): number;
    setTime(milliseconds_epoch_time: number): number;
    setUTCFullYear(year: number, month?: number, day?: number): number;
    setUTCMonth(month: number, day?: number): number;
    setUTCDate(new_utc_date: number): number;
    setUTCHours(hours: number, minutes?: number, seconds?: number, milliseconds?: number): number;
    setUTCMinutes(minutes: number, seconds?: number, milliseconds?: number): number;
    setUTCSeconds(seconds: number, milliseconds?: number): number;
    setUTCMilliseconds(new_utc_milliseconds: number): number;
    toString(): string;
    toDateString(): string;
    toUTCString(): string;
    toISOString(): string;
    toJSON(): string;
    toTimeString(): string;
    valueOf(): number;
}
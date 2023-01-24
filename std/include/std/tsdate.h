/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <TS.h>

#include "std/tsobject.h"

#include <ostream>

class Number;
class String;

class Union;

class DatePrivate;

class TS_DECLARE Date : public Object
{
public:
    TS_METHOD static Number* parse(String* date_string);

    TS_METHOD static Number* now();

    TS_METHOD TS_SIGNATURE("UTC(year: number, month: number, day?: number, hours?: number, minutes?: number, "
                           "seconds?: number, milliseconds?: number): number") static Number* UTC(Number* year,
                                                                                                  Number* month_index,
                                                                                                  Union* day,
                                                                                                  Union* hours,
                                                                                                  Union* minutes,
                                                                                                  Union* seconds,
                                                                                                  Union* milliseconds);

    TS_METHOD TS_NO_CHECK TS_SIGNATURE("constructor()") Date();

    TS_METHOD TS_NO_CHECK TS_SIGNATURE("constructor(dateString: string)") explicit Date(String* date_string);

    TS_METHOD TS_NO_CHECK
        TS_SIGNATURE("constructor(msSinceEpoch: number)") explicit Date(Number* since_epoch_milliseconds);

    TS_METHOD TS_NO_CHECK TS_SIGNATURE(
        "constructor(year: number, month: number, day?: number, hours?: number, minutes?: number, "
        "seconds?: number, milliseconds?: number)") Date(Number* year,
                                                         Number* month_index,
                                                         Union* day,
                                                         Union* hours,
                                                         Union* minutes,
                                                         Union* seconds,
                                                         Union* milliseconds);

    // getters
    TS_METHOD Number* getDate() const noexcept;

    TS_METHOD Number* getDay() const noexcept;

    TS_METHOD Number* getFullYear() const noexcept;

    TS_METHOD Number* getHours() const noexcept;

    TS_METHOD Number* getMilliseconds() const noexcept;

    TS_METHOD Number* getMinutes() const noexcept;

    TS_METHOD Number* getMonth() const noexcept;

    TS_METHOD Number* getSeconds() const noexcept;

    TS_METHOD Number* getTime() const noexcept;

    TS_METHOD Number* getTimezoneOffset() const noexcept;

    TS_METHOD Number* getUTCDate() const noexcept;

    TS_METHOD Number* getUTCDay() const noexcept;

    TS_METHOD Number* getUTCFullYear() const noexcept;

    TS_METHOD Number* getUTCHours() const noexcept;

    TS_METHOD Number* getUTCMilliseconds() const noexcept;

    TS_METHOD Number* getUTCMinutes() const noexcept;

    TS_METHOD Number* getUTCMonth() const noexcept;

    TS_METHOD Number* getUTCSeconds() const noexcept;
    // end getters

    // setters
    TS_METHOD TS_SIGNATURE("setFullYear(year: number, month?: number, day?: number): number") Number* setFullYear(
        Number* new_year, Union* new_month, Union* new_day);

    TS_METHOD TS_SIGNATURE("setMonth(month: number, day?: number): number") Number* setMonth(Number* new_month,
                                                                                             Union* new_day);

    TS_METHOD Number* setDate(Number* new_date);

    TS_METHOD TS_SIGNATURE("setHours(hours: number, minutes?: number, seconds?: number, milliseconds?: number): number")
        Number* setHours(Number* new_hours, Union* new_minutes, Union* new_seconds, Union* new_milliseconds);

    TS_METHOD TS_SIGNATURE("setMinutes(minutes: number, seconds?: number, milliseconds?: number): number")
        Number* setMinutes(Number* new_minutes, Union* new_seconds, Union* new_milliseconds);

    TS_METHOD TS_SIGNATURE("setSeconds(seconds: number, milliseconds?: number): number") Number* setSeconds(
        Number* new_seconds, Union* new_milliseconds);

    TS_METHOD Number* setMilliseconds(Number* new_milliseconds);

    TS_METHOD Number* setTime(Number* milliseconds_epoch_time);

    TS_METHOD TS_SIGNATURE("setUTCFullYear(year: number, month?: number, day?: number): number") Number* setUTCFullYear(
        Number* new_utc_year, Union* new_utc_month, Union* new_utc_days);

    TS_METHOD TS_SIGNATURE("setUTCMonth(month: number, day?: number): number") Number* setUTCMonth(
        Number* new_utc_month, Union* new_utc_day);

    TS_METHOD Number* setUTCDate(Number* new_utc_date);

    TS_METHOD TS_SIGNATURE(
        "setUTCHours(hours: number, minutes?: number, seconds?: number, milliseconds?: number): number")
        Number* setUTCHours(Number* new_utc_hours,
                            Union* new_utc_minutes,
                            Union* new_utc_seconds,
                            Union* new_utc_milliseconds);

    TS_METHOD TS_SIGNATURE("setUTCMinutes(minutes: number, seconds?: number, milliseconds?: number): number")
        Number* setUTCMinutes(Number* new_utc_minutes, Union* new_utc_seconds, Union* new_utc_milliseconds);

    TS_METHOD TS_SIGNATURE("setUTCSeconds(seconds: number, milliseconds?: number): number") Number* setUTCSeconds(
        Number* new_utc_seconds, Union* new_utc_milliseconds);

    TS_METHOD Number* setUTCMilliseconds(Number* new_utc_milliseconds);

    // end setters

    TS_METHOD String* toString() const override;

    TS_METHOD String* toDateString() const noexcept;

    TS_METHOD String* toUTCString() const noexcept;

    TS_METHOD String* toISOString() const noexcept;

    TS_METHOD String* toJSON() const noexcept;

    TS_METHOD String* toTimeString() const noexcept;

    TS_METHOD Number* valueOf() const noexcept;

    std::string toStdString() const override;

private:
    DatePrivate* _d = nullptr;
};

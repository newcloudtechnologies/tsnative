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

#include "std/tsdate.h"

#include "private/tsdate_absl_p.h"
#include "std/private/to_string_impl.h"
#include "std/private/tsdate_p.h"

#include <std/gc.h>
#include <std/tsnumber.h>
#include <std/tsstring.h>
#include <std/tsunion.h>

#define USE_ABSL_DATE_BACKEND

Number* Date::parse(String* date_string)
{
#ifdef USE_ABSL_DATE_BACKEND
    AbslDatePrivate priv;
    return new Number(priv.parse(date_string->cpp_str()));
#endif
}

Number* Date::now()
{
#ifdef USE_ABSL_DATE_BACKEND
    AbslDatePrivate priv;
    return new Number(priv.now());
#endif
}

Number* Date::UTC(
    Number* year, Number* month_index, Union* day, Union* hours, Union* minutes, Union* seconds, Union* milliseconds)
{
    double unboxedYear = year->unboxed();
    double unboxedMonthIndex = month_index->unboxed();
    double unboxedDay = day->hasValue() ? day->getValue<Number*>()->unboxed() : 0;
    double unboxedHours = hours->hasValue() ? hours->getValue<Number*>()->unboxed() : 0;
    double unboxedMinutes = minutes->hasValue() ? minutes->getValue<Number*>()->unboxed() : 0;
    double unboxedSeconds = seconds->hasValue() ? seconds->getValue<Number*>()->unboxed() : 0;
    double unboxedMilliseconds = milliseconds->hasValue() ? milliseconds->getValue<Number*>()->unboxed() : 0;

#ifdef USE_ABSL_DATE_BACKEND
    AbslDatePrivate priv;

    return new Number(priv.UTC(
        unboxedYear, unboxedMonthIndex, unboxedDay, unboxedHours, unboxedMinutes, unboxedSeconds, unboxedMilliseconds));
#endif
}

Date::Date()
    : Object(TSTypeID::Date)
#ifdef USE_ABSL_DATE_BACKEND
    , _d(new AbslDatePrivate)
#endif
{
}

Date::Date(
    Number* year, Number* month_index, Union* day, Union* hours, Union* minutes, Union* seconds, Union* milliseconds)
    : Object(TSTypeID::Date)
{
    double unboxedYear = year->unboxed();
    double unboxedMonthIndex = month_index->unboxed();
    double unboxedDay = day->hasValue() ? day->getValue<Number*>()->unboxed() : 0;
    double unboxedHours = hours->hasValue() ? hours->getValue<Number*>()->unboxed() : 0;
    double unboxedMinutes = minutes->hasValue() ? minutes->getValue<Number*>()->unboxed() : 0;
    double unboxedSeconds = seconds->hasValue() ? seconds->getValue<Number*>()->unboxed() : 0;
    double unboxedMilliseconds = milliseconds->hasValue() ? milliseconds->getValue<Number*>()->unboxed() : 0;

#ifdef USE_ABSL_DATE_BACKEND
    _d = new AbslDatePrivate(
        unboxedYear, unboxedMonthIndex, unboxedDay, unboxedHours, unboxedMinutes, unboxedSeconds, unboxedMilliseconds);
#endif
}

Date::Date(Number* since_epoch_milliseconds)
    : Object(TSTypeID::Date)
{
    double unboxedMilliseconds = since_epoch_milliseconds->unboxed();

#ifdef USE_ABSL_DATE_BACKEND
    _d = new AbslDatePrivate(unboxedMilliseconds);
#endif
}

Date::Date(String* date_string)
    : Object(TSTypeID::Date)
{
    std::string unboxedString = date_string->cpp_str();

#ifdef USE_ABSL_DATE_BACKEND
    _d = new AbslDatePrivate(unboxedString);
#endif
}

Number* Date::getDate() const noexcept
{
    double date = _d->getDate();
    return new Number(date);
}

Number* Date::getDay() const noexcept
{
    double day = _d->getDay();
    return new Number(day);
}

Number* Date::getFullYear() const noexcept
{
    double year = _d->getFullYear();
    return new Number(year);
}

Number* Date::getHours() const noexcept
{
    double hours = _d->getHours();
    return new Number(hours);
}

Number* Date::getMilliseconds() const noexcept
{
    double ms = _d->getMilliseconds();
    return new Number(ms);
}

Number* Date::getMinutes() const noexcept
{
    double minutes = _d->getMinutes();
    return new Number(minutes);
}

Number* Date::getMonth() const noexcept
{
    double month = _d->getMonth();
    return new Number(month);
}

Number* Date::getSeconds() const noexcept
{
    double seconds = _d->getSeconds();
    return new Number(seconds);
}

Number* Date::getTime() const noexcept
{
    double time = _d->getTime();
    return new Number(time);
}

Number* Date::getTimezoneOffset() const noexcept
{
    double offset = _d->getTimezoneOffset();
    return new Number(offset);
}

Number* Date::getUTCDate() const noexcept
{
    double utcDate = _d->getUTCDate();
    return new Number(utcDate);
}

Number* Date::getUTCDay() const noexcept
{
    double utcDay = _d->getUTCDay();
    return new Number(utcDay);
}

Number* Date::getUTCFullYear() const noexcept
{
    double utcYear = _d->getUTCFullYear();
    return new Number(utcYear);
}

Number* Date::getUTCMilliseconds() const noexcept
{
    double utcMs = _d->getUTCMilliseconds();
    return new Number(utcMs);
}

Number* Date::getUTCHours() const noexcept
{
    double utcHours = _d->getUTCHours();
    return new Number(utcHours);
}

Number* Date::getUTCMinutes() const noexcept
{
    double utcMinutes = _d->getUTCMinutes();
    return new Number(utcMinutes);
}

Number* Date::getUTCMonth() const noexcept
{
    double utcMonth = _d->getUTCMonth();
    return new Number(utcMonth);
}

Number* Date::getUTCSeconds() const noexcept
{
    double utcSeconds = _d->getUTCSeconds();
    return new Number(utcSeconds);
}

Number* Date::setFullYear(Number* new_year, Union* new_month, Union* new_day)
{
    double newYearUnboxed = new_year->unboxed();
    double newMonthUnboxed = new_month->hasValue() ? new_month->getValue<Number*>()->unboxed() : 0;
    double newDayUnboxed = new_day->hasValue() ? new_day->getValue<Number*>()->unboxed() : 0;

    double date = _d->setFullYear(newYearUnboxed, newMonthUnboxed, newDayUnboxed);

    return new Number(date);
}

Number* Date::setMonth(Number* new_month, Union* new_day)
{
    double newMonthUnboxed = new_month->unboxed();
    double newDayUnboxed = new_day->hasValue() ? new_day->getValue<Number*>()->unboxed() : 0;

    double date = _d->setMonth(newMonthUnboxed, newDayUnboxed);

    return new Number(date);
}

Number* Date::setDate(Number* new_date)
{
    double date = _d->setDate(new_date->unboxed());

    return new Number(date);
}

Number* Date::setHours(Number* new_hours, Union* new_minutes, Union* new_seconds, Union* new_milliseconds)
{
    double newHoursUnboxed = new_hours->unboxed();
    double newMinutesUnboxed = new_minutes->hasValue() ? new_minutes->getValue<Number*>()->unboxed() : 0;
    double newSecondsUnboxed = new_seconds->hasValue() ? new_seconds->getValue<Number*>()->unboxed() : 0;
    double newMillisecondsUnboxed = new_milliseconds->hasValue() ? new_milliseconds->getValue<Number*>()->unboxed() : 0;

    double date = _d->setHours(newHoursUnboxed, newMinutesUnboxed, newSecondsUnboxed, newMillisecondsUnboxed);

    return new Number(date);
}

Number* Date::setMinutes(Number* new_minutes, Union* new_seconds, Union* new_milliseconds)
{
    double newMinutesUnboxed = new_minutes->unboxed();
    double newSecondsUnboxed = new_seconds->hasValue() ? new_seconds->getValue<Number*>()->unboxed() : 0;
    double newMillisecondsUnboxed = new_milliseconds->hasValue() ? new_milliseconds->getValue<Number*>()->unboxed() : 0;

    double date = _d->setMinutes(newMinutesUnboxed, newSecondsUnboxed, newMillisecondsUnboxed);

    return new Number(date);
}

Number* Date::setSeconds(Number* new_seconds, Union* new_milliseconds)
{
    double newSecondsUnboxed = new_seconds->unboxed();
    double newMillisecondsUnboxed = new_milliseconds->hasValue() ? new_milliseconds->getValue<Number*>()->unboxed() : 0;

    double date = _d->setSeconds(newSecondsUnboxed, newMillisecondsUnboxed);

    return new Number(date);
}

Number* Date::setMilliseconds(Number* new_milliseconds)
{
    double newMillisecondsUnboxed = new_milliseconds->unboxed();

    double date = _d->setMilliseconds(newMillisecondsUnboxed);

    return new Number(date);
}

Number* Date::setTime(Number* milliseconds_epoch_time)
{
    double timeUnboxed = milliseconds_epoch_time->unboxed();

    double date = _d->setTime(timeUnboxed);

    return new Number(date);
}

Number* Date::setUTCFullYear(Number* new_utc_year, Union* new_utc_month, Union* new_utc_days)
{
    double newUTCYearUnboxed = new_utc_year->unboxed();
    double newUTCMonthUnboxed = new_utc_month->hasValue() ? new_utc_month->getValue<Number*>()->unboxed() : 0;
    double newUTCDaysUnboxed = new_utc_days->hasValue() ? new_utc_days->getValue<Number*>()->unboxed() : 0;

    double date = _d->setUTCFullYear(newUTCYearUnboxed, newUTCMonthUnboxed, newUTCDaysUnboxed);

    return new Number(date);
}

Number* Date::setUTCMonth(Number* new_utc_month, Union* new_utc_days)
{
    double newUTCMonthUnboxed = new_utc_month->unboxed();
    double newUTCDaysUnboxed = new_utc_days->hasValue() ? new_utc_days->getValue<Number*>()->unboxed() : 0;

    double date = _d->setUTCMonth(newUTCMonthUnboxed, newUTCDaysUnboxed);

    return new Number(date);
}

Number* Date::setUTCDate(Number* new_utc_date)
{
    double newUTCDateUnboxed = new_utc_date->unboxed();

    double date = _d->setUTCDate(newUTCDateUnboxed);

    return new Number(date);
}

Number* Date::setUTCHours(Number* new_utc_hours,
                          Union* new_utc_minutes,
                          Union* new_utc_seconds,
                          Union* new_utc_milliseconds)
{
    double newUTCHoursUnboxed = new_utc_hours->unboxed();
    double newUTCMinutesUnboxed = new_utc_minutes->hasValue() ? new_utc_minutes->getValue<Number*>()->unboxed() : 0;
    double newUTCSecondsUnboxed = new_utc_seconds->hasValue() ? new_utc_seconds->getValue<Number*>()->unboxed() : 0;
    double newUTCMillisecondsUnboxed =
        new_utc_milliseconds->hasValue() ? new_utc_milliseconds->getValue<Number*>()->unboxed() : 0;

    double date =
        _d->setUTCHours(newUTCHoursUnboxed, newUTCMinutesUnboxed, newUTCSecondsUnboxed, newUTCMillisecondsUnboxed);

    return new Number(date);
}

Number* Date::setUTCMinutes(Number* new_utc_minutes, Union* new_utc_seconds, Union* new_utc_milliseconds)
{
    double newUTCMinutesUnboxed = new_utc_minutes->unboxed();
    double newUTCSecondsUnboxed = new_utc_seconds->hasValue() ? new_utc_seconds->getValue<Number*>()->unboxed() : 0;
    double newUTCMillisecondsUnboxed =
        new_utc_milliseconds->hasValue() ? new_utc_milliseconds->getValue<Number*>()->unboxed() : 0;

    double date = _d->setUTCMinutes(newUTCMinutesUnboxed, newUTCSecondsUnboxed, newUTCMillisecondsUnboxed);

    return new Number(date);
}

Number* Date::setUTCSeconds(Number* new_utc_seconds, Union* new_utc_milliseconds)
{
    double newUTCSecondsUnboxed = new_utc_seconds->unboxed();
    double newUTCMillisecondsUnboxed =
        new_utc_milliseconds->hasValue() ? new_utc_milliseconds->getValue<Number*>()->unboxed() : 0;

    double date = _d->setUTCSeconds(newUTCSecondsUnboxed, newUTCMillisecondsUnboxed);

    return new Number(date);
}

Number* Date::setUTCMilliseconds(Number* new_utc_milliseconds)
{
    return setMilliseconds(new_utc_milliseconds);
}

std::string Date::toStdString() const
{
    return _d->toString();
}

DEFAULT_TO_STRING_IMPL(Date)

String* Date::toDateString() const noexcept
{
    auto string = _d->toDateString();
    return new String(string);
}

String* Date::toUTCString() const noexcept
{
    auto string = _d->toUTCString();
    return new String(string);
}

String* Date::toISOString() const noexcept
{
    auto string = _d->toISOString();
    return new String(string);
}

String* Date::toJSON() const noexcept
{
    return toISOString();
}

String* Date::toTimeString() const noexcept
{
    auto string = _d->toTimeString();
    return new String(string);
}

Number* Date::valueOf() const noexcept
{
    return getTime();
}

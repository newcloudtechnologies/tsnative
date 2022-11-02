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

#include "tsdate_absl_p.h"

#include "absl/time/clock.h"
#include "absl/types/optional.h"

#include <cmath>
#include <vector>

AbslDatePrivate::AbslDatePrivate()
{
    _time = absl::Now();
}

AbslDatePrivate::AbslDatePrivate(const std::string& date_string)
{
    double parsed = parse(date_string);
    _time = absl::FromUnixMillis(static_cast<long>(parsed));

    if (std::isnan(parsed))
    {
        setValid(false);
    }
}

AbslDatePrivate::AbslDatePrivate(
    double year, double month_index, double day, double hours, double minutes, double seconds, double milliseconds)
{
    if (static_cast<int64_t>(year) < 100)
    {
        year += 1900;
    }

    _time = absl::FromDateTime(static_cast<int64_t>(year),
                               static_cast<int>(month_index) + 1,
                               static_cast<int>(day),
                               static_cast<int>(hours),
                               static_cast<int>(minutes),
                               static_cast<int>(seconds),
                               absl::LocalTimeZone());

    _time += absl::FromChrono(std::chrono::milliseconds{static_cast<long>(milliseconds)});
}

AbslDatePrivate::AbslDatePrivate(double since_epoch_milliseconds)
{
    _time = absl::FromUnixMillis(static_cast<long>(since_epoch_milliseconds));

    if (std::isnan(since_epoch_milliseconds))
    {
        setValid(false);
    }
}

double AbslDatePrivate::parse(const std::string& date_string)
{
    enum Repr
    {
        Local,
        Utc
    };
    using format_t = std::pair<std::string, Repr>;

    auto t = absl::Time{};
    auto err = std::string{};

    auto parse = [&t, &err, &date_string](const format_t& fmt) -> bool {
        if (fmt.second == Repr::Local)
            return absl::ParseTime(fmt.first, date_string, absl::LocalTimeZone(), &t, &err);
        return absl::ParseTime(fmt.first, date_string, absl::UTCTimeZone(), &t, &err);
    };

    static const std::vector<format_t> formats = {
        /*ISO 8601*/
        {"%Y", Repr::Utc},
        {"%Y-%m", Repr::Utc},
        {"%Y-%m-%d", Repr::Utc},
        {"%Y-%m-%dT%H:%M", Repr::Utc},
        {"%Y-%m-%d%ET%H:%M%Ez", Repr::Utc},
        {"%Y-%m-%d%ET%H:%M:%E*S", Repr::Local},
        {absl::RFC3339_sec, Repr::Utc},
        {absl::RFC3339_full, Repr::Utc},
        /* end ISO 8601 */

        /* RFC 2822 Date and Time Specification */
        {"%b %d, %E4Y", Repr::Local},
        {"%b %d, %E4Y %H:%M:%S", Repr::Local},
        {"%b %d, %H:%M:%S", Repr::Local},
        {"%b %d, %y %H:%M", Repr::Local},
        {"%b %d, %y %H:%M:%S", Repr::Local},
        {"%b %d, %y %H:%M:%E*S", Repr::Local},
        {"%b %d, %E4Y %H:%M:%S %z", Repr::Utc},
        {"%b %d, %y %H:%M:%S GMT%z", Repr::Utc},
        {"%b %d, %y %H:%M:%S GMT%Z", Repr::Utc},
        {"%b %d, %E4Y %H:%M:%S GMT%Z", Repr::Utc},
        {"%a, %d %b %E4Y %H:%M:%S GMT", Repr::Utc},
        {"%a, %d %b %E4Y %H:%M:%S GMT%z", Repr::Utc},
        {"%a, %d %b %E4Y %H:%M:%S %z", Repr::Utc},
        {"%a, %d %b %E4Y %H:%M:%S %Z", Repr::Utc},
        /* RFC 2822 */
    };

    for (const auto& fmt : formats)
    {
        if (parse(fmt))
        {
            return static_cast<double>(absl::ToUnixMillis(t));
        }
    }

    return NaN;
}

double AbslDatePrivate::now()
{
    return static_cast<double>(absl::ToUnixMillis(absl::Now()));
}

double AbslDatePrivate::UTC(
    double year, double month_index, double day, double hours, double minutes, double seconds, double milliseconds)
{
    if (static_cast<int64_t>(year) < 100)
    {
        year += 1900;
    }

    auto time = absl::FromDateTime(static_cast<int64_t>(year),
                                   static_cast<int>(month_index) + 1,
                                   static_cast<int>(day),
                                   static_cast<int>(hours),
                                   static_cast<int>(minutes),
                                   static_cast<int>(seconds),
                                   absl::UTCTimeZone());

    time += absl::FromChrono(std::chrono::milliseconds{static_cast<long>(milliseconds)});

    return static_cast<double>(absl::ToUnixMillis(time));
}

// getters
double AbslDatePrivate::getDate() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    return static_cast<double>(absl::ToCivilDay(_time, absl::LocalTimeZone()).day());
}

double AbslDatePrivate::getDay() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    auto weekday = absl::GetWeekday(ToCivilSecond(_time, absl::LocalTimeZone()));
    return static_cast<double>(static_cast<int>(weekday) + 1);
}

double AbslDatePrivate::getFullYear() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    auto year_instance = ToCivilYear(_time, absl::LocalTimeZone());
    return static_cast<double>(year_instance.year());
}

double AbslDatePrivate::getHours() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    return static_cast<double>(absl::ToCivilHour(_time, absl::LocalTimeZone()).hour());
}

double AbslDatePrivate::getMilliseconds() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    auto millisec_per_sec = 1000;
    return static_cast<double>(absl::ToUnixMillis(_time) - absl::ToUnixSeconds(_time) * millisec_per_sec);
}

double AbslDatePrivate::getMinutes() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    return static_cast<double>(absl::ToCivilMinute(_time, absl::LocalTimeZone()).minute());
}

double AbslDatePrivate::getMonth() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    return static_cast<double>(absl::ToCivilMonth(_time, absl::LocalTimeZone()).month() - 1);
}

double AbslDatePrivate::getSeconds() const noexcept
{

    if (!isValid())
    {
        return NaN;
    }

    return static_cast<double>(absl::ToCivilSecond(_time, absl::LocalTimeZone()).second());
}

double AbslDatePrivate::getTime() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    return static_cast<double>(absl::ToUnixMillis(_time));
}

double AbslDatePrivate::getTimezoneOffset() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    auto bd = _time.In(absl::LocalTimeZone());
    return static_cast<double>(-bd.offset) / 60;
}

double AbslDatePrivate::getUTCDate() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    return static_cast<double>(absl::ToCivilDay(_time, absl::UTCTimeZone()).day());
}

double AbslDatePrivate::getUTCDay() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    auto weekday = absl::GetWeekday(ToCivilSecond(_time, absl::UTCTimeZone()));
    return static_cast<double>(static_cast<int>(weekday) + 1);
}

double AbslDatePrivate::getUTCFullYear() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    auto year_instance = ToCivilYear(_time, absl::UTCTimeZone());
    return static_cast<double>(year_instance.year());
}

double AbslDatePrivate::getUTCHours() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    return getMilliseconds();
}

double AbslDatePrivate::getUTCMilliseconds() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    return static_cast<double>(absl::ToCivilHour(_time, absl::UTCTimeZone()).hour());
}

double AbslDatePrivate::getUTCMinutes() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    return static_cast<double>(absl::ToCivilMinute(_time, absl::UTCTimeZone()).minute());
}

double AbslDatePrivate::getUTCMonth() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    return static_cast<double>(absl::ToCivilMonth(_time, absl::UTCTimeZone()).month() - 1);
}

double AbslDatePrivate::getUTCSeconds() const noexcept
{
    if (!isValid())
    {
        return NaN;
    }

    return static_cast<double>(absl::ToCivilSecond(_time, absl::UTCTimeZone()).second());
}
// end getters

// setters
double AbslDatePrivate::setFullYear(double new_year, double new_month, double new_day)
{
    auto tm = absl::ToTM(_time, absl::LocalTimeZone());
    tm.tm_year = static_cast<int64_t>(new_year) >= 1900 ? static_cast<int>(new_year - 1900)
                                                        : static_cast<int>(-(1900 - new_year));

    _time = absl::FromTM(tm, absl::LocalTimeZone());

    if (new_month != NaN)
    {
        return setMonth(new_month, new_day);
    }

    return getTime();
}

double AbslDatePrivate::setMonth(double new_month, double new_day)
{
    auto tm = absl::ToTM(_time, absl::LocalTimeZone());
    tm.tm_mon = static_cast<int>(new_month) + 1;

    _time = absl::FromTM(tm, absl::LocalTimeZone());

    if (new_day != NaN)
    {
        return setDate(new_day);
    }

    return getTime();
}

double AbslDatePrivate::setDate(double new_date)
{
    auto tm = absl::ToTM(_time, absl::LocalTimeZone());
    tm.tm_mday = static_cast<int>(new_date);

    _time = absl::FromTM(tm, absl::LocalTimeZone());

    return getTime();
}

double AbslDatePrivate::setHours(double new_hours, double new_minutes, double new_seconds, double new_milliseconds)
{
    auto tm = absl::ToTM(_time, absl::LocalTimeZone());
    tm.tm_hour = static_cast<int>(new_hours);

    _time = absl::FromTM(tm, absl::LocalTimeZone());

    if (new_minutes != NaN)
    {
        return setMinutes(new_minutes, new_seconds, new_milliseconds);
    }

    return getTime();
}

double AbslDatePrivate::setMinutes(double new_minutes, double new_seconds, double new_milliseconds)
{
    auto tm = absl::ToTM(_time, absl::LocalTimeZone());
    tm.tm_min = static_cast<int>(new_minutes);

    _time = absl::FromTM(tm, absl::LocalTimeZone());

    if (new_seconds != NaN)
    {
        return setSeconds(new_seconds, new_milliseconds);
    }

    return getTime();
}

double AbslDatePrivate::setSeconds(double new_seconds, double new_milliseconds)
{
    auto tm = absl::ToTM(_time, absl::LocalTimeZone());
    tm.tm_sec = static_cast<int>(new_seconds);

    _time = absl::FromTM(tm, absl::LocalTimeZone());

    if (new_milliseconds != NaN)
    {
        setMilliseconds(new_milliseconds);
    }

    return getTime();
}

double AbslDatePrivate::setMilliseconds(double new_milliseconds)
{
    _time -= absl::FromChrono(std::chrono::milliseconds{static_cast<long>(getMilliseconds())});
    _time += absl::FromChrono(std::chrono::milliseconds{static_cast<long>(new_milliseconds)});

    return getTime();
}

double AbslDatePrivate::setTime(double milliseconds_epoch_time)
{
    _time -= absl::FromChrono(std::chrono::milliseconds{static_cast<long>(getTime())});
    _time += absl::FromChrono(std::chrono::milliseconds{static_cast<long>(milliseconds_epoch_time)});

    return getTime();
}

double AbslDatePrivate::setUTCFullYear(double new_utc_year, double new_utc_month, double new_utc_days)
{
    auto tm = absl::ToTM(_time, absl::UTCTimeZone());
    tm.tm_year = static_cast<int64_t>(new_utc_year) >= 1900 ? static_cast<int>(new_utc_year - 1900)
                                                            : static_cast<int>(-(1900 - new_utc_year));

    _time = absl::FromTM(tm, absl::UTCTimeZone());

    if (new_utc_month != NaN)
    {
        return setUTCMonth(new_utc_month, new_utc_days);
    }

    return getTime();
}

double AbslDatePrivate::setUTCMonth(double new_utc_month, double new_utc_day)
{
    auto tm = absl::ToTM(_time, absl::UTCTimeZone());
    tm.tm_mon = static_cast<int>(new_utc_month);

    _time = absl::FromTM(tm, absl::UTCTimeZone());

    if (new_utc_day != NaN)
    {
        return setUTCDate(new_utc_day);
    }

    return getTime();
}

double AbslDatePrivate::setUTCDate(double new_utc_date)
{
    auto tm = absl::ToTM(_time, absl::UTCTimeZone());
    tm.tm_mday = static_cast<int>(new_utc_date);

    _time = absl::FromTM(tm, absl::UTCTimeZone());

    return getTime();
}

double AbslDatePrivate::setUTCHours(double new_utc_hours,
                                    double new_utc_minutes,
                                    double new_utc_seconds,
                                    double new_utc_milliseconds)
{
    auto tm = absl::ToTM(_time, absl::UTCTimeZone());
    tm.tm_hour = static_cast<int>(new_utc_hours);

    _time = absl::FromTM(tm, absl::UTCTimeZone());

    if (new_utc_minutes != NaN)
    {
        return setUTCMinutes(new_utc_minutes, new_utc_seconds, new_utc_milliseconds);
    }

    return getTime();
}

double AbslDatePrivate::setUTCMinutes(double new_utc_minutes, double new_utc_seconds, double new_utc_milliseconds)
{
    auto tm = absl::ToTM(_time, absl::UTCTimeZone());
    tm.tm_min = static_cast<int>(new_utc_minutes);

    _time = absl::FromTM(tm, absl::UTCTimeZone());

    if (new_utc_seconds != NaN)
    {
        return setUTCSeconds(new_utc_seconds, new_utc_milliseconds);
    }

    return getTime();
}

double AbslDatePrivate::setUTCSeconds(double new_utc_seconds, double new_utc_milliseconds)
{
    auto tm = absl::ToTM(_time, absl::UTCTimeZone());
    tm.tm_sec = static_cast<int>(new_utc_seconds);

    _time = absl::FromTM(tm, absl::UTCTimeZone());

    if (new_utc_milliseconds != NaN)
    {
        return setUTCMilliseconds(new_utc_milliseconds);
    }

    return getTime();
}

double AbslDatePrivate::setUTCMilliseconds(double new_utc_milliseconds)
{
    return setMilliseconds(new_utc_milliseconds);
}
// end setters

std::string AbslDatePrivate::toString() const noexcept
{
    constexpr auto fmt = "%a %b %d %4Y %H:%M:%S GMT%z (%Z)";
    return isValid() ? FormatTime(fmt, _time, absl::LocalTimeZone()) : "Invalid Date";
}

std::string AbslDatePrivate::toDateString() const noexcept
{
    constexpr auto fmt = "%a %b %d %Y";
    return isValid() ? FormatTime(fmt, _time, absl::LocalTimeZone()) : "Invalid Date";
}

std::string AbslDatePrivate::toUTCString() const noexcept
{
    constexpr auto fmt = "%a, %d %b %4Y %H:%M:%S GMT";
    return isValid() ? FormatTime(fmt, _time, absl::UTCTimeZone()) : "Invalid Date";
}

std::string AbslDatePrivate::toISOString() const noexcept
{
    constexpr auto fmt = "%FT%H:%M:%E3SZ";
    return isValid() ? absl::FormatTime(fmt, _time, absl::UTCTimeZone()) : "Invalid Date";
}

std::string AbslDatePrivate::toJSON() const noexcept
{
    return toISOString();
}

std::string AbslDatePrivate::toTimeString() const noexcept
{
    constexpr auto fmt = "%H:%M:%S GMT%z (%Z)";
    return isValid() ? FormatTime(fmt, _time, absl::LocalTimeZone()) : "Invalid Date";
}

double AbslDatePrivate::valueOf() const noexcept
{
    return getTime();
}

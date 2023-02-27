/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <limits>
#include <string>

// mkrv @todo: move to Number
const auto NaN = std::numeric_limits<double>::quiet_NaN();

class DatePrivate
{
public:
    virtual double parse(const std::string& date_string) = 0;
    virtual double now() = 0;
    virtual double UTC(double year,
                       double month_index,
                       double day,
                       double hours,
                       double minutes,
                       double seconds,
                       double milliseconds) = 0;

    virtual ~DatePrivate() = default;

    // getters
    virtual double getDate() const noexcept = 0;
    virtual double getDay() const noexcept = 0;
    virtual double getFullYear() const noexcept = 0;
    virtual double getHours() const noexcept = 0;
    virtual double getMilliseconds() const noexcept = 0;
    virtual double getMinutes() const noexcept = 0;
    virtual double getMonth() const noexcept = 0;
    virtual double getSeconds() const noexcept = 0;
    virtual double getTime() const noexcept = 0;
    virtual double getTimezoneOffset() const noexcept = 0;
    virtual double getUTCDate() const noexcept = 0;
    virtual double getUTCDay() const noexcept = 0;
    virtual double getUTCFullYear() const noexcept = 0;
    virtual double getUTCHours() const noexcept = 0;
    virtual double getUTCMilliseconds() const noexcept = 0;
    virtual double getUTCMinutes() const noexcept = 0;
    virtual double getUTCMonth() const noexcept = 0;
    virtual double getUTCSeconds() const noexcept = 0;
    // end getters

    // setters
    virtual double setFullYear(double new_year, double new_month, double new_day) = 0;
    virtual double setMonth(double new_month, double new_day) = 0;
    virtual double setDate(double new_date) = 0;
    virtual double setHours(double new_hours, double new_minutes, double new_seconds, double new_milliseconds) = 0;
    virtual double setMinutes(double new_minutes, double new_seconds, double new_milliseconds) = 0;
    virtual double setSeconds(double new_seconds, double new_milliseconds) = 0;
    virtual double setMilliseconds(double new_milliseconds) = 0;
    virtual double setTime(double milliseconds_epoch_time) = 0;
    virtual double setUTCFullYear(double new_utc_year, double new_utc_month, double new_utc_days) = 0;
    virtual double setUTCMonth(double new_utc_month, double new_utc_day) = 0;
    virtual double setUTCDate(double new_utc_date) = 0;
    virtual double setUTCHours(double new_utc_hours,
                               double new_utc_minutes,
                               double new_utc_seconds,
                               double new_utc_milliseconds) = 0;
    virtual double setUTCMinutes(double new_utc_minutes, double new_utc_seconds, double new_utc_milliseconds) = 0;
    virtual double setUTCSeconds(double new_utc_seconds, double new_utc_milliseconds) = 0;
    virtual double setUTCMilliseconds(double new_utc_milliseconds) = 0;
    // end setters

    virtual std::string toString() const noexcept = 0;
    virtual std::string toDateString() const noexcept = 0;
    virtual std::string toUTCString() const noexcept = 0;
    virtual std::string toISOString() const noexcept = 0;
    virtual std::string toJSON() const noexcept = 0;
    virtual std::string toTimeString() const noexcept = 0;

    virtual double valueOf() const noexcept = 0;

    bool isValid() const noexcept
    {
        return is_valid;
    }

    void setValid(bool isValid)
    {
        is_valid = isValid;
    }

private:
    bool is_valid = true;
};

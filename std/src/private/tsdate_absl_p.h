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

#include "std/private/tsdate_p.h"

#include <absl/time/time.h>

class AbslDatePrivate : public DatePrivate
{
public:
    AbslDatePrivate();
    AbslDatePrivate(const std::string& date_string);
    AbslDatePrivate(
        double year, double month_index, double day, double hours, double minutes, double seconds, double milliseconds);
    AbslDatePrivate(double since_epoch_milliseconds);

    ~AbslDatePrivate() override = default;

    double parse(const std::string& date_string) override;
    double now() override;
    double UTC(double year,
               double month_index,
               double day,
               double hours,
               double minutes,
               double seconds,
               double milliseconds) override;

    // getters
    double getDate() const noexcept override;
    double getDay() const noexcept override;
    double getFullYear() const noexcept override;
    double getHours() const noexcept override;
    double getMilliseconds() const noexcept override;
    double getMinutes() const noexcept override;
    double getMonth() const noexcept override;
    double getSeconds() const noexcept override;
    double getTime() const noexcept override;
    double getTimezoneOffset() const noexcept override;
    double getUTCDate() const noexcept override;
    double getUTCDay() const noexcept override;
    double getUTCFullYear() const noexcept override;
    double getUTCHours() const noexcept override;
    double getUTCMilliseconds() const noexcept override;
    double getUTCMinutes() const noexcept override;
    double getUTCMonth() const noexcept override;
    double getUTCSeconds() const noexcept override;
    // end getters

    // setters
    double setFullYear(double new_year, double new_month, double new_day) override;
    double setMonth(double new_month, double new_day) override;
    double setDate(double new_date) override;
    double setHours(double new_hours, double new_minutes, double new_seconds, double new_milliseconds) override;
    double setMinutes(double new_minutes, double new_seconds, double new_milliseconds) override;
    double setSeconds(double new_seconds, double new_milliseconds) override;
    double setMilliseconds(double new_milliseconds) override;
    double setTime(double milliseconds_epoch_time) override;
    double setUTCFullYear(double new_utc_year, double new_utc_month, double new_utc_days) override;
    double setUTCMonth(double new_utc_month, double new_utc_day) override;
    double setUTCDate(double new_utc_date) override;
    double setUTCHours(double new_utc_hours,
                       double new_utc_minutes,
                       double new_utc_seconds,
                       double new_utc_milliseconds) override;
    double setUTCMinutes(double new_utc_minutes, double new_utc_seconds, double new_utc_milliseconds) override;
    double setUTCSeconds(double new_utc_seconds, double new_utc_milliseconds) override;
    double setUTCMilliseconds(double new_utc_milliseconds) override;
    // end setters

    std::string toString() const noexcept override;
    std::string toDateString() const noexcept override;
    std::string toUTCString() const noexcept override;
    std::string toISOString() const noexcept override;
    std::string toJSON() const noexcept override;
    std::string toTimeString() const noexcept override;

    double valueOf() const noexcept override;

private:
    absl::Time _time;
};

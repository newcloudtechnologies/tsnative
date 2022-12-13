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

const string_equal_to = function (date_1: Date, date_2: Date): boolean {
    return date_1.toString() === date_2.toString()
        && date_1.toUTCString() === date_2.toUTCString()
        && date_1.toISOString() === date_2.toISOString()
        && date_1.toDateString() === date_2.toDateString()
        && date_1.toTimeString() === date_2.toTimeString();
}

// FIXME: most tests wait for a AN-857: СXX extensions default arguments support

{
    const wrong_date_format = "2021-01-01 GG WP";
    const date = new Date(wrong_date_format);

    console.log(date.toString())
    console.assert(date.toString() === "Invalid Date", "Wrong date format");
};

{
    const date_1 = new Date("2021-01-01");
    const date_2 = new Date("2021-01-01");

    console.assert(string_equal_to(date_1, date_2), "Date from string");
}

{
    const date = new Date("December 17, 1995 03:24:00");

    console.assert(date.toString() !== "Invalid Date", "Valid Date from string");
}

{
    const date1 = new Date(1995, 11, 17, 3, 24, 0);
    const date2 = new Date('1995-12-17T04:24:00');

    console.assert(date1 !== date2);
    console.assert((date2.getTime() - date1.getTime()) === 3600000);
}

{
    const date_1 = new Date(819159840035);
    const date_2 = new Date("1995-12-17T00:24:00.035Z");

    console.assert(string_equal_to(date_1, date_2), "Same dates from string & number");
}

{
    const date_1 = new Date("1995-12-17T00:24:00.035Z");
    const date_2 = new Date("1995-12-17T07:24:00");

    console.assert(!string_equal_to(date_1, date_2), "Msecs matters");
}

{
    const date_1 = new Date("1995-12-17T00:24:00.035Z");
    const date_2 = new Date(Date.UTC(1995, 11, 17, 0, 24, 0, 35));

    console.assert(string_equal_to(date_1, date_2));
}

{
    const date_1 = new Date("1995-12-17T00:24:00");
    const date_2 = new Date(1995, 11, 17, 0, 24);

    console.assert(string_equal_to(date_1, date_2));
}

// end Constructors

// Setters
{
    const date_1 = new Date();
    const date_2 = new Date();

    date_1.setFullYear(2021);
    date_2.setFullYear(2021);

    console.assert(date_1.getFullYear() === date_2.getFullYear(), "Full years equal");
    console.assert(date_1.getFullYear() === 2021, "Correct full year (1)");
    console.assert(date_2.getFullYear() === 2021, "Correct full year (2)");
}

{
    const date_1 = new Date();
    const date_2 = new Date();

    date_1.setMonth(11);
    date_2.setMonth(11);

    console.assert(date_1.getMonth() === date_2.getMonth(), "Months equal");
    console.assert(date_1.getMonth() === 11, "Correct month (1)");
    console.assert(date_2.getMonth() === 11, "Correct month (2)");
}

{
    const date_1 = new Date();
    const date_2 = new Date();

    date_1.setDate(4);
    date_2.setDate(4);

    console.assert(date_1.getDate() === date_2.getDate(), "Dates equal");
    console.assert(date_1.getDate() === 4, "Correct date (1)");
    console.assert(date_2.getDate() === 4, "Correct date (2)");
}

{
    const date_1 = new Date();
    const date_2 = new Date();

    date_1.setHours(23);
    date_2.setHours(23);

    console.assert(date_1.getHours() === date_2.getHours(), "Hours equal");
    console.assert(date_1.getHours() === 23, "Correct hours (1)");
    console.assert(date_2.getHours() === 23, "Correct hours (2)");
}

{
    const date_1 = new Date();
    const date_2 = new Date();

    date_1.setMinutes(23);
    date_2.setMinutes(23);

    console.assert(date_1.getMinutes() === date_2.getMinutes(), "Minutes equal");
    console.assert(date_1.getMinutes() === 23, "Correct minutes (1)");
    console.assert(date_2.getMinutes() === 23, "Correct minutes (2)");
}

{
    const date_1 = new Date();
    const date_2 = new Date();

    date_1.setSeconds(23);
    date_2.setSeconds(23);

    console.assert(date_1.getMinutes() === date_2.getMinutes(), "Minutes equal");
    console.assert(date_1.getSeconds() === 23, "Correct seconds (1)");
    console.assert(date_2.getSeconds() === 23, "Correct seconds (2)");
}

{
    const date_1 = new Date();
    const date_2 = new Date();

    date_1.setMilliseconds(999);
    date_2.setMilliseconds(999);

    console.assert(date_1.getMilliseconds() === date_2.getMilliseconds(), "Equal msecs");
    console.assert(date_1.getMilliseconds() === 999, "Correct msecs (1)");
    console.assert(date_2.getMilliseconds() === 999, "Correct msecs (2)");
}

// end Setters

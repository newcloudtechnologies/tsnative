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

#include "Strings.h"

#include <algorithm>
#include <cctype>
#include <stdarg.h>
#include <string.h>
#include <vector>

namespace utils
{

std::string strprintf(const char* format, ...)
{
    va_list argptr, argptr2;
    std::vector<char> buffer;

    va_start(argptr, format);
    va_copy(argptr2, argptr);

    std::size_t length = vsnprintf(NULL, 0, format, argptr) + 1;
    va_end(argptr);
    buffer.resize(length, 0);

    vsnprintf(&buffer[0], buffer.size(), format, argptr2);
    va_end(argptr2);

    return std::string(&buffer[0]);
}

std::vector<std::string> split(const std::string& s, const std::string& delimiter)
{
    std::vector<std::string> parts;
    int _beg = 0;
    int _end = 0;

    if (s.empty())
        return parts;

    while (_end >= 0)
    {
        _end = s.find(delimiter, _beg);

        std::string part = s.substr(_beg, _end - _beg);

        parts.push_back(part);

        _beg = _end + delimiter.length();
    }

    return parts;
}

bool starts_with(const std::string& str, const std::string& prefix)
{
    return str.size() >= prefix.size() && 0 == str.compare(0, prefix.size(), prefix);
}

bool ends_with(const std::string& str, const std::string& suffix)
{
    return str.size() >= suffix.size() && 0 == str.compare(str.size() - suffix.size(), suffix.size(), suffix);
}

void ltrim_if(std::string& s, std::function<bool(char)> pred)
{
    s.erase(s.begin(), std::find_if(s.begin(), s.end(), pred));
}

void rtrim_if(std::string& s, std::function<bool(char)> pred)
{
    s.erase(std::find_if(s.rbegin(), s.rend(), pred).base(), s.end());
}

void trim_if(std::string& s, std::function<bool(char)> pred)
{
    ltrim_if(s, pred);
    rtrim_if(s, pred);
}

void ltrim(std::string& s)
{
    ltrim_if(s, [](char ch) { return ch != ' '; });
}

void rtrim(std::string& s)
{
    rtrim_if(s, [](char ch) { return ch != ' '; });
}

void trim(std::string& s)
{
    ltrim(s);
    rtrim(s);
}

bool includes(const std::string& s, const std::string& sub, std::size_t pos)
{
    return s.find(sub, pos) != std::string::npos;
}

std::string join(std::vector<std::string> list, const std::string& delimiter)
{
    if (list.empty())
        return "";

    std::string front = list.front();
    list.erase(list.begin());

    std::ostringstream os;

    os << front;

    for (const auto& it : list)
    {
        os << delimiter << it;
    }

    return os.str();
}

void replace_all(std::string& s, const std::string& search, const std::string& replace)
{
    for (size_t pos = 0;; pos += replace.length())
    {
        // Locate the substring to replace
        pos = s.find(search, pos);
        if (pos == std::string::npos)
            break;

        // Replace by erasing and inserting
        s.erase(pos, search.length());
        s.insert(pos, replace);
    }
}

std::string toUpperCase(std::string s)
{
    std::transform(s.begin(), s.end(), s.begin(), [](unsigned char c) { return std::toupper(c); });
    return s;
}

std::string toLowerCase(std::string s)
{
    std::transform(s.begin(), s.end(), s.begin(), [](unsigned char c) { return std::tolower(c); });
    return s;
}

template <>
std::string toString<const char*>(const char* value)
{
    return value;
}

template <>
std::string toString<std::string>(std::string value)
{
    return value;
}

} // namespace utils

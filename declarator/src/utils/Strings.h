/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <functional>
#include <sstream>
#include <string>
#include <vector>

namespace utils
{

std::string strprintf(const char* format, ...);
std::vector<std::string> split(const std::string& s, const std::string& delimiter);
bool starts_with(const std::string& s, const std::string& prefix);
bool ends_with(const std::string& str, const std::string& suffix);

void ltrim_if(std::string& s, std::function<bool(char)> pred);
void rtrim_if(std::string& s, std::function<bool(char)> pred);
void trim_if(std::string& s, std::function<bool(char)> pred);

void ltrim(std::string& s);
void rtrim(std::string& s);
void trim(std::string& s);

bool includes(const std::string& s, const std::string& sub, std::size_t pos = 0);

std::string join(std::vector<std::string> list, const std::string& delimiter = ", ");

void replace_all(std::string& s, const std::string& search, const std::string& replace);

template <typename T>
bool is_type(const std::string& s, T& result)
{
    std::istringstream iss(s);
    iss >> result;

    return !iss.fail() && iss.eof();
}

template <typename T, typename... Ts>
std::string stringify(const T& first, const Ts&... rest)
{
    std::ostringstream os;
    os << first;

    ((os << ", " << rest), ...);

    return os.str();
}

template <typename T>
std::string toString(T value)
{
    return std::to_string(value);
}

template <>
std::string toString<const char*>(const char* value);

template <>
std::string toString<std::string>(std::string value);

} // namespace utils

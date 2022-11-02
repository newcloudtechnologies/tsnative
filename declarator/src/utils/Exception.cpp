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

#include "Exception.h"
#include "Paths.h"
#include "Strings.h"

#include <iostream>
#include <sstream>
#include <stdarg.h>
#include <utility>
#include <vector>

namespace
{
constexpr int FILE_LEVEL = 3;

//
// remove namespace prefix from function name
//
std::string _func(const char* function)
{
    std::string result = function;
    auto parts = ::utils::split(function, "::");

    if (!parts.empty())
    {
        result = parts.at(parts.size() - 1);
    }

    return result;
}

//
// cut file path
//
std::string _file(const char* file)
{
    return ::utils::cutPath(file, FILE_LEVEL);
}

} // namespace

namespace utils
{

Exception::Exception(const char* message, const char* function, const char* file, unsigned int line)
    : Exception(R"(%s, func: %s, file: %s, line: %d)", message, _func(function).c_str(), _file(file).c_str(), line)
{
}

Exception::Exception(const char* format, ...)
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

    m_what.assign(buffer.begin(), buffer.end());
}

const char* Exception::what() const noexcept
{
    return m_what.c_str();
}

template <typename T>
Exception& Exception::operator<<(const T& t)
{
    std::ostringstream oss;
    oss << t;
    m_what += oss.str();

    return *this;
}

std::string make_stamp(const char* function, const char* file, unsigned int line)
{
    return strprintf(R"({func: %s, file: %s:%d})", _func(function).c_str(), _file(file).c_str(), line);
}

} // namespace utils
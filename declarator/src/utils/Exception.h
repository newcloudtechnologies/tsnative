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

#include <exception>
#include <iostream>
#include <sstream>
#include <stdarg.h>
#include <string>
#include <utility>
#include <vector>

namespace utils
{

class Exception : public std::exception
{
    std::string m_what;

public:
    Exception(const char* format, ...)
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

    template <typename T>
    Exception& operator<<(const T& t)
    {
        std::ostringstream oss;
        oss << t;
        m_what += oss.str();

        return *this;
    }

    virtual const char* what() const noexcept
    {
        return m_what.c_str();
    }
};

} // namespace utils

#define _ASSERT(exp)                   \
    ((exp) ? ((void)0)                 \
           : throw ::utils::Exception( \
                 "Assert: \"%s:\", func: %s, file: %s, line: %d", #exp, __FUNCTION__, __FILE__, __LINE__))
#define _THROW(msg) \
    throw ::utils::Exception("Message: %s, func: %s, file: %s, line: %d", #msg, __FUNCTION__, __FILE__, __LINE__)

#define _STAMP() ::utils::Exception("func: %s, file: %s, line: %d", __FUNCTION__, __FILE__, __LINE__).what()

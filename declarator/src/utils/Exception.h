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

#include <exception>
#include <string>

namespace utils
{

class Exception : public std::exception
{
    std::string m_what;

public:
    Exception(const char* message, const char* function, const char* file, unsigned int line);
    Exception(const char* format, ...);

    const char* what() const noexcept override;

    template <typename T>
    Exception& operator<<(const T& t);
};

std::string make_stamp(const char* function, const char* file, unsigned int line);

} // namespace utils

#define _ASSERT(exp)                                           \
    ((exp) ? ((void)0)                                         \
           : throw ::utils::Exception("Assertion \"" #exp "\"" \
                                      "failed",                \
                                      __FUNCTION__,            \
                                      __FILE__,                \
                                      __LINE__))

#define _THROW(msg) throw ::utils::Exception(#msg, __FUNCTION__, __FILE__, __LINE__)

#define _STAMP() ::utils::make_stamp(__FUNCTION__, __FILE__, __LINE__).c_str()

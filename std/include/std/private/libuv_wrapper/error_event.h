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

#include <type_traits>

namespace uv
{

struct ErrorEvent
{
    template <typename U, typename = std::enable_if_t<std::is_integral<U>::value>>
    explicit ErrorEvent(U val) noexcept
        : _ec{static_cast<int>(val)}
    {
    }

    static int translate(int sys) noexcept;

    const char* what() const noexcept;

    const char* name() const noexcept;

    int code() const noexcept;

    explicit operator bool() const noexcept;

private:
    const int _ec;
};
} // namespace uv
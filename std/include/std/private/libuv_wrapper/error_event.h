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
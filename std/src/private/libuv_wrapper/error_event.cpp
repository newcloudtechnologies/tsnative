#include "std/private/libuv_wrapper/error_event.h"

#include <uv.h>

namespace uv
{

int ErrorEvent::translate(int sys) noexcept
{
    return uv_translate_sys_error(sys);
}

const char* ErrorEvent::what() const noexcept
{
    return uv_strerror(_ec);
}

const char* ErrorEvent::name() const noexcept
{
    return uv_err_name(_ec);
}

int ErrorEvent::code() const noexcept
{
    return _ec;
}

ErrorEvent::operator bool() const noexcept
{
    return _ec < 0;
}

} // namespace uv
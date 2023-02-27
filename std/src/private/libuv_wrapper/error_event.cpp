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
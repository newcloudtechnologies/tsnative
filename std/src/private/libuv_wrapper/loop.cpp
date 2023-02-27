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

#include "std/private/libuv_wrapper/loop.h"

namespace uv
{

std::unique_ptr<uv_loop_t> uv::Loop::createUvLoop()
{
    return std::make_unique<uv_loop_t>();
}

Loop::Loop() noexcept
    : _loop{std::move(Loop::createUvLoop())}
    , isLoopInitialized{uv_loop_init(_loop.get()) == 0}
{
}

Loop::~Loop() noexcept
{
    if (_loop)
    {
        close();
        _loop.reset();
    }
}

int Loop::close()
{
    int res = 0;

    if (_loop)
    {
        res = uv_loop_close(_loop.get());
    }
    return res;
}

int Loop::run(Loop::RunMode run_mode) noexcept
{
    return uv_run(_loop.get(), static_cast<uv_run_mode>(run_mode));
}

bool Loop::alive() const noexcept
{
    return uv_loop_alive(_loop.get());
}

void Loop::stop() noexcept
{
    uv_stop(_loop.get());
}

uv_loop_t* Loop::raw() const noexcept
{
    return _loop.get();
}

bool Loop::isInitialized() const
{
    return isLoopInitialized;
}

} // namespace uv

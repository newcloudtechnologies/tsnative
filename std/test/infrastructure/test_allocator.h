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

#include <functional>
#include <vector>

class TestAllocator
{
public:
    struct Callbacks final
    {
        std::function<void(void*)> onAllocated = [](void*) {};
    };

    TestAllocator(Callbacks&& callbacks);

    void* allocate(std::size_t n)
    {
        auto result = ::operator new(n);
        _callbacks.onAllocated(result);

        return result;
    }

private:
    Callbacks _callbacks;
};

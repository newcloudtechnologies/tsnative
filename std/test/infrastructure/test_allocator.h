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

#pragma once

#include <cstdint>
#include <functional>

class Object;

class Allocator final
{
public:
    struct Callbacks final
    {
        std::function<void(Object*)> onObjectAllocated = [](Object*){};
        std::function<void(void*)> beforeMemoryDeallocated = [](void*){};
    };

    Allocator(Callbacks&& callbacks);

    void* allocate(std::size_t n);
    void* allocateObject(std::size_t n);
    void deallocate(void* m);

private:
    void* doAllocate(std::size_t n);

private:
    Callbacks _callbacks;
};
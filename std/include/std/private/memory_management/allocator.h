#pragma once

#include <cstdint>
#include <functional>
#include <string>

class Object;

class Allocator final
{
public:
    Allocator();

    void* allocate(std::size_t n);
    void* allocateObject(std::size_t n);
    void deallocateObject(Object* ptr) noexcept;

private:
    void* doAllocate(std::size_t n);
};
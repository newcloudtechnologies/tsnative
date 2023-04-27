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

#include "std/private/memory_management/allocator.h"
#include "std/private/logger.h"
#include "std/tsobject.h"

#include <numeric>

Allocator::Allocator()
{
    LOG_METHOD_CALL;
}

void* Allocator::allocate(std::size_t n)
{
    auto* result = doAllocate(n);
    LOG_ADDRESS("Allocated " + std::to_string(n) + " using allocate ", result);
    return result;
}

void* Allocator::doAllocate(std::size_t n)
{
    LOG_METHOD_CALL;
    return ::operator new(n);
}

void* Allocator::allocateObject(std::size_t n)
{
    auto* memory = doAllocate(n);
    LOG_ADDRESS("Allocated " + std::to_string(n) + " bytes using allocateObject ", memory);
    return memory;
}

void Allocator::deallocateObject(Object* ptr) noexcept
{
    LOG_METHOD_CALL;
    delete ptr;
}

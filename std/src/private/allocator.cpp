/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "std/private/allocator.h"

#include "std/tsobject.h"

#include "std/private/logger.h"

Allocator::Allocator(Callbacks&& callbacks)
    : _callbacks{std::move(callbacks)}
{
}

void* Allocator::allocate(std::size_t n)
{
    auto* result = doAllocate(n);
    LOG_ADDRESS("Allocated " + std::to_string(n) + " using allocate ", result);
    return result;
}

void* Allocator::doAllocate(std::size_t n)
{
    return malloc(n);
}

void* Allocator::allocateObject(std::size_t n)
{
    auto* memory = doAllocate(n);
    auto* object = Object::asObject(memory);

    LOG_ADDRESS("Allocated " + std::to_string(n) + " bytes using allocateObject ", memory);

    _callbacks.onObjectAllocated(object);

    return memory;
}
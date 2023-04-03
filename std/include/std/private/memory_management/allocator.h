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
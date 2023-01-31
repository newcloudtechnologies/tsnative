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

#pragma once

#include <cstddef>

class Object;
class String;

class IGCImpl
{
public:
    virtual ~IGCImpl() = default;

    virtual std::size_t getAliveObjectsCount() const = 0;

    // These methods make IGCImpl to be leaky abstraction
    // We can avoid them by notifying gc implementation about adding/removing roots
    // from the compiler level
    virtual void addRoot(Object** object, const String* associatedName) = 0;
    virtual void removeRoot(Object** object) = 0;

    virtual void collect() = 0;

    virtual void print() const = 0;
};

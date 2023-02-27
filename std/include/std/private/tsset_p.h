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

#include <cstddef>
#include <functional>
#include <vector>

template <typename V>
class SetPrivate
{
public:
    virtual ~SetPrivate() = default;

    virtual bool has(V value) const = 0;

    virtual void add(V value) = 0;

    virtual bool remove(V value) = 0;
    virtual void clear() = 0;

    virtual std::size_t size() const = 0;

    // TODO Provide iterators for set and remove this method
    virtual const std::vector<V>& ordered() const = 0;
    // TODO This method should be removed and replaced by iterators?
    virtual void forEach(std::function<void(V&)> callable) = 0;
    // TODO This method should be removed and replaced by iterators?
    virtual void forEach(std::function<void(const V&)> callable) const = 0;

    virtual std::string toString() const = 0;
};

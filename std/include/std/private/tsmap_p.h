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
#include <string>
#include <type_traits>
#include <vector>

template <typename K, typename V>
class MapPrivate
{
    static_assert(std::is_pointer<K>::value && std::is_pointer<V>::value,
                  "Expected map keys and values of pointer type");

public:
    virtual ~MapPrivate() = default;

    virtual void set(K key, V value) = 0;

    virtual bool has(K key) const = 0;
    virtual V get(K key) const = 0;

    virtual bool remove(K key) = 0;
    virtual void clear() = 0;

    virtual std::size_t size() const = 0;

    // TODO This method should be removed and replaced by iterators?
    virtual const std::vector<K>& orderedKeys() const = 0;
    // TODO This method should be removed and replaced by iterators?
    virtual void forEachEntry(std::function<void(std::pair<K, V>&)> callable) = 0;
    // TODO This method should be removed and replaced by iterators?
    virtual void forEachEntry(std::function<void(const std::pair<K, V>&)> callable) const = 0;

    virtual std::string toString() const = 0;
};

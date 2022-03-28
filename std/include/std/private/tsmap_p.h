#pragma once

#include <string>
#include <type_traits>
#include <vector>

template <typename K, typename V>
class MapPrivate
{
    static_assert(std::is_pointer<K>::value && std::is_pointer<V>::value, "Expected map keys and values of pointer type");

public:
    virtual void set(K key, V value) = 0;

    virtual bool has(K key) const = 0;
    virtual V get(K key) const = 0;

    virtual bool remove(K key) = 0;
    virtual void clear() = 0;

    virtual int size() const = 0;

    virtual const std::vector<K>& orderedKeys() const = 0;

    virtual std::string toString() const = 0;
};

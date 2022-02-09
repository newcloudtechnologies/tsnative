#pragma once

#include <vector>

template <typename K, typename V>
class MapPrivate
{
public:
    virtual void set(K key, V value) = 0;

    virtual bool has(K key) const = 0;
    virtual V get(K key) const = 0;

    virtual bool remove(K key) = 0;
    virtual void clear() = 0;

    virtual int size() const = 0;

    virtual const std::vector<K>& orderedKeys() const = 0;
};

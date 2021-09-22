#pragma once

#include <algorithm>
#include <cassert>
#include <unordered_map>
#include <utility>
#include <vector>

#include <iostream>

template <typename K, typename V>
class OrderedMap
{
public:
    void clear()
    {
        _orderedKeys.clear();
        _hashmap.clear();
    }

    bool remove(K key)
    {
        auto mapIt = _hashmap.find(key);
        if (mapIt == _hashmap.end())
        {
            return false;
        }

        _hashmap.erase(mapIt);

        auto vecIt = std::find_if(
            _orderedKeys.cbegin(), _orderedKeys.cend(), [&key](K value) { return std::equal_to<K>()(key, value); });
        assert(vecIt != _orderedKeys.cend());
        _orderedKeys.erase(vecIt);

        return true;
    }

    V get(K key) const
    {
        auto it = _hashmap.find(key);

        if (it == _hashmap.end())
        {
            return {};
        }

        return it->second;
    }

    bool has(K key) const
    {
        auto it = _hashmap.find(key);
        return it != _hashmap.end();
    }

    void set(K key, V value)
    {
        auto it = _hashmap.find(key);
        if (it != _hashmap.end())
        {
            it->second = value;
            return;
        }

        _hashmap[key] = value;
        _orderedKeys.push_back(key);
    }

    size_t size() const
    {
        return _hashmap.size();
    }

    const std::vector<K>& orderedKeys() const
    {
        return _orderedKeys;
    }

private:
    std::unordered_map<K, V> _hashmap;
    std::vector<K> _orderedKeys;
};

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

#include <algorithm>
#include <cassert>
#include <sstream>
#include <unordered_map>
#include <utility>
#include <vector>

#include "std/private/comparators.h"
#include "std/private/tsmap_p.h"

template <typename K, typename V>
class MapStdPrivate : public MapPrivate<K, V>
{
public:
    void set(K key, V value) override;

    bool has(K key) const override;
    V get(K key) const override;

    bool remove(K key) override;
    void clear() override;

    std::size_t size() const override;

    const std::vector<K>& orderedKeys() const override;
    void forEachEntry(std::function<void(std::pair<K, V>&)> callable) override;
    void forEachEntry(std::function<void(const std::pair<K, V>&)> callable) const override;

    std::string toString() const override;

    template <typename U, typename W>
    friend std::ostream& operator<<(std::ostream& os, const MapStdPrivate<U, W>* m);

private:
    std::unordered_map<K, V> _hashmap;
    std::vector<K> _orderedKeys;
};

template <typename K, typename V>
void MapStdPrivate<K, V>::forEachEntry(std::function<void(std::pair<K, V>&)> callable)
{
    for (auto& key : _orderedKeys)
    {
        auto& value = _hashmap.at(key);
        auto p = std::make_pair(key, value);
        callable(p);
    }
}

template <typename K, typename V>
void MapStdPrivate<K, V>::forEachEntry(std::function<void(const std::pair<K, V>&)> callable) const
{
    for (auto& key : _orderedKeys)
    {
        auto& value = _hashmap.at(key);
        auto p = std::make_pair(key, value);
        callable(p);
    }
}

template <typename K, typename V>
void MapStdPrivate<K, V>::set(K key, V value)
{
    auto it = std::find_if(_hashmap.begin(),
                           _hashmap.end(),
                           [&key](const std::pair<K, V>& pair) { return std::equal_to<K>()(pair.first, key); });
    if (it != _hashmap.end())
    {
        it->second = value;
        return;
    }

    _hashmap[key] = value;
    _orderedKeys.push_back(key);
}

template <typename K, typename V>
bool MapStdPrivate<K, V>::has(K key) const
{
    auto it = std::find_if(_hashmap.cbegin(),
                           _hashmap.cend(),
                           [&key](const std::pair<K, V>& pair) { return std::equal_to<K>()(pair.first, key); });
    return it != _hashmap.end();
}

template <typename K, typename V>
V MapStdPrivate<K, V>::get(K key) const
{
    auto it = std::find_if(_hashmap.cbegin(),
                           _hashmap.cend(),
                           [&key](const std::pair<K, V>& pair) { return std::equal_to<K>()(pair.first, key); });

    if (it == _hashmap.end())
    {
        return {};
    }

    return it->second;
}

template <typename K, typename V>
bool MapStdPrivate<K, V>::remove(K key)
{
    auto mapIt = std::find_if(_hashmap.cbegin(),
                              _hashmap.cend(),
                              [&key](const std::pair<K, V>& pair) { return std::equal_to<K>()(pair.first, key); });

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

template <typename K, typename V>
void MapStdPrivate<K, V>::clear()
{
    _orderedKeys.clear();
    _hashmap.clear();
}

template <typename K, typename V>
std::size_t MapStdPrivate<K, V>::size() const
{
    return _hashmap.size();
}

template <typename K, typename V>
const std::vector<K>& MapStdPrivate<K, V>::orderedKeys() const
{
    return _orderedKeys;
}

template <typename K, typename V>
std::string MapStdPrivate<K, V>::toString() const
{
    std::ostringstream oss;
    oss << this;
    return oss.str();
}

template <typename K, typename V>
inline std::ostream& operator<<(std::ostream& os, const MapStdPrivate<K, V>* m)
{
    os << "Map {\n";

    for (auto* key : m->_orderedKeys)
    {
        os << "    " << key << ": " << m->get(key) << "\n";
    }

    os << "}";

    return os;
}

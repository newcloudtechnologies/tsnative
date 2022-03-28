#pragma once

#include <algorithm>
#include <cassert>
#include <sstream>
#include <unordered_map>
#include <utility>
#include <vector>

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

    int size() const override;

    const std::vector<K>& orderedKeys() const override;

    std::string toString() const override;

    template <typename U, typename W>
    friend std::ostream& operator<<(std::ostream& os, const MapStdPrivate<U, W>* m);

private:
    std::unordered_map<K, V> _hashmap;
    std::vector<K> _orderedKeys;
};

template <typename K, typename V>
void MapStdPrivate<K, V>::set(K key, V value)
{
    auto it = std::find_if(_hashmap.begin(), _hashmap.end(), [&key](const std::pair<K, V>& pair) { return std::equal_to<K>()(pair.first, key); });
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
    auto it = std::find_if(_hashmap.cbegin(), _hashmap.cend(), [&key](const std::pair<K, V>& pair) { return std::equal_to<K>()(pair.first, key); });
    return it != _hashmap.end();
}

template <typename K, typename V>
V MapStdPrivate<K, V>::get(K key) const
{
    auto it = std::find_if(_hashmap.cbegin(), _hashmap.cend(), [&key](const std::pair<K, V>& pair) { return std::equal_to<K>()(pair.first, key); });

    if (it == _hashmap.end())
    {
        return {};
    }

    return it->second;
}

template <typename K, typename V>
bool MapStdPrivate<K, V>::remove(K key)
{
    auto mapIt = std::find_if(_hashmap.cbegin(), _hashmap.cend(), [&key](const std::pair<K, V>& pair) { return std::equal_to<K>()(pair.first, key); });

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
int MapStdPrivate<K, V>::size() const
{
    return static_cast<int>(_hashmap.size());
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

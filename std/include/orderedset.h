#pragma once

#include <algorithm>
#include <cassert>
#include <set>
#include <utility>
#include <vector>

template <typename V>
class OrderedSet
{
public:
    void clear()
    {
        _ordered.clear();
        _set.clear();
    }

    bool remove(V value)
    {
        auto setIt = _set.find(value);
        if (setIt == _set.end())
        {
            return false;
        }

        _set.erase(setIt);

        auto vecIt = std::find_if(
            _ordered.cbegin(), _ordered.cend(), [&value](V v) { return std::equal_to<V>()(v, value); });
        assert(vecIt != _ordered.cend());
        _ordered.erase(vecIt);

        return true;
    }

    bool has(V value) const
    {
        auto it = _set.find(value);
        return it != _set.end();
    }

    void add(V value)
    {
        if (has(value))
        {
            return;
        }

        _set.insert(value);
        _ordered.push_back(value);
    }

    size_t size() const
    {
        return _set.size();
    }

    const std::vector<V>& ordered() const
    {
        return _ordered;
    }

private:
    std::set<V> _set;
    std::vector<V> _ordered;
};

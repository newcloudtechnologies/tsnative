#pragma once

#include <algorithm>
#include <cassert>
#include <set>
#include <utility>
#include <vector>

#include "tsset_p.h"

template <typename V>
class SetStdPrivate : public SetPrivate<V>
{
public:
    bool has(V value) const override;

    void add(V value) override;

    bool remove(V value) override;
    void clear() override;

    int size() const override;

    const std::vector<V>& ordered() const override;

private:
    std::set<V> _set;
    std::vector<V> _ordered;
};

template <typename V>
bool SetStdPrivate<V>::has(V value) const
{
    auto it = _set.find(value);
    return it != _set.end();
}

template <typename V>
void SetStdPrivate<V>::add(V value)
{
    if (has(value))
    {
        return;
    }

    _set.insert(value);
    _ordered.push_back(value);
}

template <typename V>
bool SetStdPrivate<V>::remove(V value)
{
    auto setIt = _set.find(value);
    if (setIt == _set.end())
    {
        return false;
    }

    _set.erase(setIt);

    auto vecIt =
        std::find_if(_ordered.cbegin(), _ordered.cend(), [&value](V v) { return std::equal_to<V>()(v, value); });

    assert(vecIt != _ordered.cend());

    _ordered.erase(vecIt);
    return true;
}

template <typename V>
void SetStdPrivate<V>::clear()
{
    _ordered.clear();
    _set.clear();
}

template <typename V>
int SetStdPrivate<V>::size() const
{
    return static_cast<int>(_set.size());
}

template <typename V>
const std::vector<V>& SetStdPrivate<V>::ordered() const
{
    return _ordered;
}

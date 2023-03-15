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
#include <ostream>
#include <set>
#include <sstream>
#include <utility>
#include <vector>

#include "tsset_p.h"

#include "std/private/comparators.h"

template <typename V>
class SetStdPrivate : public SetPrivate<V>
{
public:
    bool has(V value) const override;

    void add(V value) override;

    bool remove(V value) override;
    void clear() override;

    std::size_t size() const override;

    const std::vector<V>& ordered() const override;
    void forEach(std::function<void(V&)> callable) override;
    void forEach(std::function<void(const V&)> callable) const override;

private:
    std::set<V> _set;
    std::vector<V> _ordered;
};

template <typename V>
bool SetStdPrivate<V>::has(V value) const
{
    auto it = std::find_if(_set.cbegin(), _set.cend(), [&value](V v) { return std::equal_to<V>()(v, value); });
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
    auto setIt = std::find_if(_set.cbegin(), _set.cend(), [&value](V v) { return std::equal_to<V>()(v, value); });
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
std::size_t SetStdPrivate<V>::size() const
{
    return _set.size();
}

template <typename V>
void SetStdPrivate<V>::forEach(std::function<void(V&)> callable)
{
    for (auto& v : _ordered)
    {
        callable(v);
    }
}

template <typename V>
void SetStdPrivate<V>::forEach(std::function<void(const V&)> callable) const
{
    for (auto& v : _ordered)
    {
        callable(v);
    }
}

template <typename V>
const std::vector<V>& SetStdPrivate<V>::ordered() const
{
    return _ordered;
}

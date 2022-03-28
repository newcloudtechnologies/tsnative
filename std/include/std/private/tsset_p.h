#pragma once

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

    virtual int size() const = 0;

    virtual const std::vector<V>& ordered() const = 0;

    virtual std::string toString() const = 0;
};

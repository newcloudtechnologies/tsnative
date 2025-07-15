#pragma once

#include <cstddef>
#include <functional>
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

    virtual std::size_t size() const = 0;

    // TODO Provide iterators for set and remove this method
    virtual const std::vector<V>& ordered() const = 0;
    // TODO This method should be removed and replaced by iterators?
    virtual void forEach(std::function<void(V&)> callable) = 0;
    // TODO This method should be removed and replaced by iterators?
    virtual void forEach(std::function<void(const V&)> callable) const = 0;
};

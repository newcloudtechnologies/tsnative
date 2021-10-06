#pragma once

#include "array.h"
#include "gc.h"
#include "iterable.h"
#include "tsclosure.h"

#include "iterators/setiterator.h"
#include "datatypes/orderedset.h"

#include <utility>

template <typename V>
class Set : public Iterable<V>
{
public:
    Set();

    void clear();
    bool remove(V value);
    void forEach(TSClosure* visitor) const;
    bool has(V value) const;
    Set<V>* add(V value);
    double size() const;

    IterableIterator<V>* values();
    IterableIterator<V>* iterator() override;
    IterableIterator<V>* keys();

private:
    template <typename U = V>
    typename std::enable_if<std::is_pointer<U>::value, U>::type getPointerToValue(U value) const
    {
        return value;
    }

    template <typename U = V>
    typename std::enable_if<!std::is_pointer<U>::value, U>::type* getPointerToValue(U value) const
    {
        return GC::createHeapAllocated<U>(value);
    }

    OrderedSet<V> _set;
};

template <typename V>
Set<V>::Set()
{
}

template <typename V>
void Set<V>::clear()
{
    _set.clear();
}

template <typename V>
bool Set<V>::remove(V value)
{
    return _set.remove(value);
}

template <typename V>
void Set<V>::forEach(TSClosure* visitor) const
{
    const auto& ordered = _set.ordered();
    for (size_t i = 0; i < ordered.size(); ++i)
    {
        if (visitor->getNumArgs() > 0)
        {
            visitor->setEnvironmentElement(getPointerToValue(ordered.at(i)), 0);
        }

        if (visitor->getNumArgs() > 1)
        {
            visitor->setEnvironmentElement(getPointerToValue(ordered.at(i)), 1);
        }

        if (visitor->getNumArgs() > 2)
        {
            visitor->setEnvironmentElement(const_cast<Set<V>*>(this), 2);
        }

        visitor->operator()();
    }
}

template <typename V>
bool Set<V>::has(V value) const
{
    return _set.has(value);
}

template <typename V>
Set<V>* Set<V>::add(V value)
{
    _set.add(value);
    return this;
}

template <typename V>
double Set<V>::size() const
{
    return static_cast<double>(_set.size());
}

template <typename V>
IterableIterator<V>* Set<V>::values()
{
    auto values = Array<V>::fromStdVector(_set.ordered());
    auto it = new SetIterator<V>(values);
    return GC::track(it);
}

template <typename V>
IterableIterator<V>* Set<V>::iterator()
{
    return values();
}

template <typename V>
IterableIterator<V>* Set<V>::keys()
{
    return values();
}

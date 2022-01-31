#pragma once

#include "array.h"
#include "gc.h"
#include "iterable.h"
#include "tsclosure.h"
#include "tsnumber.h"

#include "datatypes/orderedset.h"
#include "iterators/setiterator.h"

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
    Number* size() const;

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
    auto numArgs = visitor->getNumArgs()->valueOf();

    for (size_t i = 0; i < ordered.size(); ++i)
    {
        if (numArgs > 0)
        {
            visitor->setEnvironmentElement(getPointerToValue(ordered.at(i)), 0);
        }

        if (numArgs > 1)
        {
            visitor->setEnvironmentElement(getPointerToValue(ordered.at(i)), 1);
        }

        if (numArgs > 2)
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
Number* Set<V>::size() const
{
    return GC::createHeapAllocated<Number>(_set.size());
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

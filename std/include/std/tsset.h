#pragma once

#include "gc.h"
#include "iterable.h"
#include "tsarray.h"
#include "tsclosure.h"
#include "tsnumber.h"

#include "datatypes/orderedset.h"
#include "iterators/setiterator.h"

#include <utility>

template <typename V>
class Set : public Iterable<V>
{
    static_assert(std::is_pointer<V>::value, "TS Set elements expected to be of pointer type");

public:
    Set();

    void clear();
    Boolean* remove(V value);
    void forEach(TSClosure* visitor) const;
    Boolean* has(V value) const;
    Set<V>* add(V value);
    Number* size() const;

    IterableIterator<V>* values();
    IterableIterator<V>* iterator() override;
    IterableIterator<V>* keys();

private:
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
Boolean* Set<V>::remove(V value)
{
    return GC::createHeapAllocated<Boolean>(_set.remove(value));
}

template <typename V>
void Set<V>::forEach(TSClosure* visitor) const
{
    const auto& ordered = _set.ordered();
    auto numArgs = visitor->getNumArgs()->unboxed();

    for (size_t i = 0; i < ordered.size(); ++i)
    {
        if (numArgs > 0)
        {
            visitor->setEnvironmentElement(ordered.at(i), 0);
        }

        if (numArgs > 1)
        {
            visitor->setEnvironmentElement(ordered.at(i), 1);
        }

        if (numArgs > 2)
        {
            visitor->setEnvironmentElement(const_cast<Set<V>*>(this), 2);
        }

        visitor->operator()();
    }
}

template <typename V>
Boolean* Set<V>::has(V value) const
{
    return GC::createHeapAllocated<Boolean>(_set.has(value));
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

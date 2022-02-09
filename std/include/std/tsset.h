#pragma once

#include "iterable.h"

#ifdef USE_SET_STD_BACKEND
#include "std/private/tsset_std_p.h"
#endif

#include "std/iterators/setiterator.h"
#include "std/tsarray.h"
#include "std/tsboolean.h"
#include "std/tsclosure.h"

template <typename V>
class Set : public Iterable<V>
{
    static_assert(std::is_pointer<V>::value, "TS Set elements expected to be of pointer type");

public:
    Set();

    Boolean* has(V value) const;
    Set<V>* add(V value);

    Boolean* remove(V value);
    void clear();

    Number* size() const;

    void forEach(TSClosure* visitor) const;

    IterableIterator<V>* values();
    IterableIterator<V>* iterator() override;
    IterableIterator<V>* keys();

private:
    SetPrivate<V>* _d = nullptr;
};

template <typename V>
Set<V>::Set()
#ifdef USE_SET_STD_BACKEND
    : _d(new SetStdPrivate<V>())
#endif
{
}

template <typename V>
void Set<V>::clear()
{
    _d->clear();
}

template <typename V>
Boolean* Set<V>::remove(V value)
{
    bool result = _d->remove(value);
    return GC::track(new Boolean(result));
}

template <typename V>
void Set<V>::forEach(TSClosure* visitor) const
{
    const auto& ordered = _d->ordered();
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
    bool result = _d->has(value);
    return GC::track(new Boolean(result));
}

template <typename V>
Set<V>* Set<V>::add(V value)
{
    _d->add(value);
    return this;
}

template <typename V>
Number* Set<V>::size() const
{
    int size = _d->size();
    return GC::track(new Number(static_cast<double>(size)));
}

template <typename V>
IterableIterator<V>* Set<V>::values()
{
    auto values = Array<V>::fromStdVector(_d->ordered());
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

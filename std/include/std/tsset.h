#pragma once

#include <TS.h>

#include "std/private/options.h"

#include "std/iterable.h"
#include "std/tsarray.h"
#include "std/tsboolean.h"
#include "std/tsclosure.h"

#include "std/iterators/setiterator.h"

#ifdef USE_SET_STD_BACKEND
#include "std/private/tsset_std_p.h"
#endif

template <typename V>
class TS_EXPORT Set : public Iterable<V>
{
    static_assert(std::is_pointer<V>::value, "TS Set elements expected to be of pointer type");

public:
    TS_METHOD Set();

    TS_METHOD Boolean* has(V value) const;
    TS_METHOD TS_SIGNATURE("add(value: V): this") Set<V>* add(V value);

    TS_METHOD TS_NAME("delete") TS_DECORATOR("MapsTo('remove')") TS_IGNORE Boolean* remove(V value);
    TS_METHOD void clear();

    TS_METHOD TS_GETTER Number* size() const;

    TS_METHOD TS_SIGNATURE("forEach(callbackfn: (value: V, value2: V, set: Set<V>) => void): void") void forEach(TSClosure* visitor) const;

    TS_METHOD TS_RETURN_TYPE("ArrayIterator<V>") IterableIterator<V>* values();
    TS_METHOD TS_RETURN_TYPE("ArrayIterator<V>") IterableIterator<V>* keys();

    // TODO: computed property name
    TS_METHOD TS_RETURN_TYPE("SetIterator<V>") IterableIterator<V>* iterator() override;
    
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

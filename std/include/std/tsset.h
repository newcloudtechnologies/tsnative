/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <TS.h>

#include "std/private/options.h"

#include "std/iterable.h"
#include "std/tsarray.h"
#include "std/tsboolean.h"
#include "std/tsclosure.h"
#include "std/tsobject.h"
#include "std/tsstring.h"

#include <sstream>

#include "std/iterators/setiterator.h"

#ifdef USE_SET_STD_BACKEND
#include "std/private/tsset_std_p.h"
#endif

#include "std/private/logger.h"

template <typename T>
class SetPrivate;

template <typename T>
class TS_DECLARE Set : public Iterable<T>
{
    static_assert(std::is_pointer<T>::value, "TS Set elements expected to be of pointer type");

public:
    TS_METHOD Set();
    ~Set() override;

    TS_METHOD Boolean* has(T value) const;
    TS_METHOD TS_SIGNATURE("add(value: T): this") Set<T>* add(T value);

    TS_METHOD TS_NAME("delete") TS_DECORATOR("MapsTo('remove')") Boolean* remove(T value);
    TS_METHOD void clear();

    TS_METHOD TS_GETTER Number* size() const;

    TS_METHOD TS_SIGNATURE("forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void): void") void forEach(
        TSClosure* visitor) const;

    TS_METHOD TS_RETURN_TYPE("ArrayIterator<T>") IterableIterator<T>* values();
    TS_METHOD TS_RETURN_TYPE("ArrayIterator<T>") IterableIterator<T>* keys();

    TS_METHOD TS_SIGNATURE("[Symbol.iterator](): SetIterator<T>")
        TS_DECORATOR("MapsTo('iterator')") IterableIterator<T>* iterator() override;

    TS_METHOD String* toString() const override;

    void markChildren() override;

private:
    SetPrivate<T>* _d = nullptr;
};

template <typename T>
Set<T>::Set()
    : Iterable<T>(TSTypeID::Set)
#ifdef USE_SET_STD_BACKEND
    , _d(new SetStdPrivate<T>())
#endif
{
}

template <typename T>
Set<T>::~Set()
{
    delete _d;
}

template <typename T>
void Set<T>::clear()
{
    _d->clear();
}

template <typename T>
Boolean* Set<T>::remove(T value)
{
    bool result = _d->remove(value);
    return new Boolean(result);
}

template <typename T>
void Set<T>::forEach(TSClosure* visitor) const
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
            visitor->setEnvironmentElement(const_cast<Set<T>*>(this), 2);
        }

        visitor->operator()();
    }
}

template <typename T>
Boolean* Set<T>::has(T value) const
{
    bool result = _d->has(value);
    return new Boolean(result);
}

template <typename T>
Set<T>* Set<T>::add(T value)
{
    _d->add(value);
    return this;
}

template <typename T>
Number* Set<T>::size() const
{
    int size = _d->size();
    return new Number(static_cast<double>(size));
}

template <typename T>
IterableIterator<T>* Set<T>::values()
{
    auto values = Array<T>::fromStdVector(_d->ordered());
    return new SetIterator<T>(values);
}

template <typename T>
IterableIterator<T>* Set<T>::iterator()
{
    return values();
}

template <typename T>
IterableIterator<T>* Set<T>::keys()
{
    return values();
}

template <typename T>
String* Set<T>::toString() const
{
    return new String(_d->toString());
}

template <typename T>
void Set<T>::markChildren()
{
    LOG_INFO("Calling Set::markChildren");
    const auto callable = [](T& entry)
    {
        auto* object = static_cast<Object*>(entry);
        if (object && !object->isMarked())
        {
            LOG_ADDRESS("Mark set element: ", object);
            object->mark();
        }
    };

    _d->forEach(callable);
}

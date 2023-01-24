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
#include "std/tsclosure.h"
#include "std/tsnumber.h"
#include "std/tsobject.h"
#include "std/tstuple.h"

#include <sstream>

#include "std/iterators/mapiterator.h"

#ifdef USE_MAP_STD_BACKEND
#include "std/private/tsmap_std_p.h"
#endif

#include "std/private/logger.h"

// add TS_DECLARE to template specialization
template class TS_DECLARE Iterable<Tuple*>;

template <typename K, typename V>
class TS_DECLARE Map : public Iterable<Tuple*>
{
    static_assert(std::is_pointer<K>::value && std::is_pointer<V>::value,
                  "TS Map keys/values expected to be of pointer type");

public:
    TS_METHOD Map();
    ~Map() override;

    TS_METHOD TS_RETURN_TYPE("this") Map<K, V>* set(K key, V value);

    TS_METHOD Boolean* has(K key) const;
    TS_METHOD V get(K key) const;

    TS_METHOD TS_NAME("delete") TS_DECORATOR("MapsTo('remove')") Boolean* remove(K key);
    TS_METHOD void clear();

    TS_METHOD TS_GETTER Number* size() const;

    TS_METHOD TS_SIGNATURE("forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void") void forEach(
        TSClosure* visitor) const;

    TS_METHOD TS_RETURN_TYPE("ArrayIterator<K>") IterableIterator<K>* keys();
    TS_METHOD TS_RETURN_TYPE("ArrayIterator<V>") IterableIterator<V>* values();

    TS_METHOD TS_SIGNATURE("[Symbol.iterator](): MapIterator<[K, V]>")
        TS_DECORATOR("MapsTo('iterator')") IterableIterator<Tuple*>* iterator() override;

    TS_METHOD String* toString() const override;

    std::vector<Object*> getChildObjects() const override;
    std::string toStdString() const override;

    friend class Object;

private:
    MapPrivate<K, V>* _d;
};

template <typename K, typename V>
Map<K, V>::Map()
    : Iterable<Tuple*>(TSTypeID::Map)
#ifdef USE_MAP_STD_BACKEND
    , _d(new MapStdPrivate<K, V>())
#endif
{
}

template <typename K, typename V>
Map<K, V>::~Map()
{
    delete _d;
}

template <typename K, typename V>
void Map<K, V>::clear()
{
    _d->clear();
}

template <typename K, typename V>
Boolean* Map<K, V>::remove(K key)
{
    bool result = _d->remove(key);
    return new Boolean(result);
}

template <typename K, typename V>
void Map<K, V>::forEach(TSClosure* visitor) const
{
    const auto& orderedKeys = _d->orderedKeys();
    auto numArgs = visitor->getNumArgs()->unboxed();

    for (size_t i = 0; i < orderedKeys.size(); ++i)
    {
        if (numArgs > 0)
        {
            visitor->setEnvironmentElement(get(orderedKeys.at(i)), 0);
        }

        if (numArgs > 1)
        {
            visitor->setEnvironmentElement(orderedKeys.at(i), 1);
        }

        if (numArgs > 2)
        {
            visitor->setEnvironmentElement(const_cast<Map<K, V>*>(this), 2);
        }

        visitor->operator()();
    }
}

template <typename K, typename V>
V Map<K, V>::get(K key) const
{
    return _d->get(key);
}

template <typename K, typename V>
Boolean* Map<K, V>::has(K key) const
{
    bool result = _d->has(key);
    return new Boolean(result);
}

template <typename K, typename V>
Map<K, V>* Map<K, V>::set(K key, V value)
{
    _d->set(key, value);
    return this;
}

template <typename K, typename V>
Number* Map<K, V>::size() const
{
    int size = _d->size();
    return new Number(static_cast<double>(size));
}

template <typename K, typename V>
IterableIterator<V>* Map<K, V>::values()
{
    std::vector<V> values;
    values.reserve(_d->size());

    for (const K& key : _d->orderedKeys())
    {
        values.push_back(get(key));
    }

    auto valuesArray = Array<V>::fromStdVector(values);
    return new ArrayIterator<V>(valuesArray);
}

template <typename K, typename V>
IterableIterator<Tuple*>* Map<K, V>::iterator()
{
    auto keys = _d->orderedKeys();
    auto zipped = new Array<Tuple*>();

    for (const K& key : keys)
    {
        auto tuple = new Tuple();
        tuple->push(Object::asObjectPtr(key));
        tuple->push(Object::asObjectPtr(get(key)));

        zipped->push(tuple);
    }

    return new MapIterator<Tuple*>(zipped);
}

template <typename K, typename V>
std::string Map<K, V>::toStdString() const
{
    return _d->toString();
}

template <typename K, typename V>
String* Map<K, V>::toString() const
{
    return new String(toStdString());
}

template <typename K, typename V>
IterableIterator<K>* Map<K, V>::keys()
{
    auto keys = Array<K>::fromStdVector(_d->orderedKeys());
    return new ArrayIterator<K>(keys);
}

template <typename K, typename V>
std::vector<Object*> Map<K, V>::getChildObjects() const
{
    auto result = Object::getChildObjects();

    const auto callable = [&result](std::pair<K, V>& entry)
    {
        auto* key = Object::asObjectPtr(entry.first);
        auto* value = Object::asObjectPtr(entry.second);

        if (key)
        {
            result.push_back(key);
        }
        if (value)
        {
            result.push_back(value);
        }
    };
    _d->forEachEntry(callable);

    return result;
}

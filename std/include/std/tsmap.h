#pragma once

#include "gc.h"
#include "iterable.h"
#include "tsarray.h"
#include "tsclosure.h"
#include "tsnumber.h"
#include "tstuple.h"

#include "datatypes/orderedmap.h"
#include "iterators/mapiterator.h"

template <typename K, typename V>
class Map : public Iterable<Tuple<K, V>*>
{
    static_assert(std::is_pointer<K>::value && std::is_pointer<V>::value, "TS Map keys/values expected to be of pointer type");

public:
    Map();

    void clear();
    Boolean* remove(K key);
    void forEach(TSClosure* visitor) const;
    V get(K key) const;
    Boolean* has(K key) const;
    Map<K, V>* set(K key, V value);
    Number* size() const;

    IterableIterator<V>* values();

    IterableIterator<Tuple<K, V>*>* iterator() override;
    IterableIterator<K>* keys();

private:
    OrderedMap<K, V> _map;
};

template <typename K, typename V>
Map<K, V>::Map()
{
}

template <typename K, typename V>
void Map<K, V>::clear()
{
    _map.clear();
}

template <typename K, typename V>
Boolean* Map<K, V>::remove(K key)
{
    return GC::createHeapAllocated<Boolean>(_map.remove(key));
}

template <typename K, typename V>
void Map<K, V>::forEach(TSClosure* visitor) const
{
    const auto& orderedKeys = _map.orderedKeys();
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
    return _map.get(key);
}

template <typename K, typename V>
Boolean* Map<K, V>::has(K key) const
{
    return GC::createHeapAllocated<Boolean>(_map.has(key));
}

template <typename K, typename V>
Map<K, V>* Map<K, V>::set(K key, V value)
{
    _map.set(key, value);
    return this;
}

template <typename K, typename V>
Number* Map<K, V>::size() const
{
    return GC::createHeapAllocated<Number>(_map.size());
}

template <typename K, typename V>
IterableIterator<V>* Map<K, V>::values()
{
    std::vector<V> values;
    values.reserve(_map.size());

    for (const K& key : _map.orderedKeys())
    {
        values.push_back(get(key));
    }

    auto valuesArray = Array<V>::fromStdVector(values);
    auto it = new ArrayIterator<V>(valuesArray);
    return GC::track(it);
}

template <typename K, typename V>
IterableIterator<Tuple<K, V>*>* Map<K, V>::iterator()
{
    auto keys = _map.orderedKeys();
    auto zipped = new Array<Tuple<K, V>*>();

    for (const K& key : keys)
    {
        auto tuple = new Tuple<K, V>{key, get(key)};
        zipped->push(GC::track(tuple));
    }

    auto it = new MapIterator<Tuple<K, V>*>(zipped);
    return GC::track(it);
}

template <typename K, typename V>
IterableIterator<K>* Map<K, V>::keys()
{
    auto keys = Array<K>::fromStdVector(_map.orderedKeys());
    auto it = new ArrayIterator<K>(keys);
    return GC::track(it);
}

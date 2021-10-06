#pragma once

#include "array.h"
#include "gc.h"
#include "iterable.h"
#include "tsclosure.h"
#include "tuple.h"

#include "datatypes/orderedmap.h"
#include "iterators/mapiterator.h"

template <typename K, typename V>
class Map : public Iterable<Tuple<K, V>*>
{
public:
    Map();

    void clear();
    bool remove(K key);
    void forEach(TSClosure* visitor) const;
    V get(K key) const;
    bool has(K key) const;
    Map<K, V>* set(K key, V value);
    double size() const;

    IterableIterator<V>* values();

    using KPointer = typename std::conditional<std::is_pointer<K>::value, K, typename std::add_pointer<K>::type>::type;
    using VPointer = typename std::conditional<std::is_pointer<V>::value, V, typename std::add_pointer<V>::type>::type;

    IterableIterator<Tuple<K, V>*>* iterator() override;
    IterableIterator<K>* keys();

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
bool Map<K, V>::remove(K key)
{
    return _map.remove(key);
}

template <typename K, typename V>
void Map<K, V>::forEach(TSClosure* visitor) const
{
    const auto& orderedKeys = _map.orderedKeys();
    for (size_t i = 0; i < orderedKeys.size(); ++i)
    {
        if (visitor->getNumArgs() > 0)
        {
            visitor->setEnvironmentElement(getPointerToValue(get(orderedKeys.at(i))), 0);
        }

        if (visitor->getNumArgs() > 1)
        {
            visitor->setEnvironmentElement(getPointerToValue(orderedKeys.at(i)), 1);
        }

        if (visitor->getNumArgs() > 2)
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
bool Map<K, V>::has(K key) const
{
    return _map.has(key);
}

template <typename K, typename V>
Map<K, V>* Map<K, V>::set(K key, V value)
{
    _map.set(key, value);
    return this;
}

template <typename K, typename V>
double Map<K, V>::size() const
{
    return static_cast<double>(_map.size());
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

    for (const K& key : keys) {
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

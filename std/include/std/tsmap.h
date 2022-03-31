#pragma once

#include "std/private/options.h"

#include "std/gc.h"
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

template <typename K, typename V>
class Map : public Object, public Iterable<Tuple*>
{
    static_assert(std::is_pointer<K>::value && std::is_pointer<V>::value,
                  "TS Map keys/values expected to be of pointer type");

public:
    Map();
    ~Map() override;

    Map<K, V>* set(K key, V value);

    Boolean* has(K key) const;
    V get(K key) const;

    Boolean* remove(K key);
    void clear();

    Number* size() const;

    void forEach(TSClosure* visitor) const;

    IterableIterator<K>* keys();
    IterableIterator<V>* values();

    IterableIterator<Tuple*>* iterator() override;

    String* toString() const override;

    template <typename U, typename W>
    friend std::ostream& operator<<(std::ostream& os, const Map<U, W>* m);

    friend class Object;

private:
    MapPrivate<K, V>* _d;
};

template <typename K, typename V>
Map<K, V>::Map()
#ifdef USE_MAP_STD_BACKEND
    : _d(new MapStdPrivate<K, V>())
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
    return GC::track(new Boolean(result));
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
    return GC::track(new Boolean(result));
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
    return GC::track(new Number(static_cast<double>(size)));
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
    auto it = new ArrayIterator<V>(valuesArray);
    return GC::track(it);
}

template <typename K, typename V>
IterableIterator<Tuple*>* Map<K, V>::iterator()
{
    auto keys = _d->orderedKeys();
    auto zipped = new Array<Tuple*>();

    for (const K& key : keys)
    {
        auto tuple = new Tuple();
        tuple->push(static_cast<Object*>(key));
        tuple->push(static_cast<Object*>(get(key)));

        zipped->push(GC::track(tuple));
    }

    auto it = new MapIterator<Tuple*>(zipped);
    return GC::track(it);
}

template <typename K, typename V>
String* Map<K, V>::toString() const
{
    return GC::track(new String(_d->toString()));
}

template <typename K, typename V>
IterableIterator<K>* Map<K, V>::keys()
{
    auto keys = Array<K>::fromStdVector(_d->orderedKeys());
    auto it = new ArrayIterator<K>(keys);
    return GC::track(it);
}

template <typename K, typename V>
inline std::ostream& operator<<(std::ostream& os, const Map<K, V>* m)
{
    os << m->_d->toString();
    return os;
}

#pragma once

#include <TS.h>

// FIXME: can't find Iterable<T> in collection if Iterable located inside namespace

/*
namespace global IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{
*/

template <typename T>
class TS_EXPORT IteratorResult
{
public:
    IteratorResult(bool done, T value);
};

template <typename T>
class TS_EXPORT Iterator
{
public:
    TS_METHOD virtual IteratorResult<T>* next() = 0;
};

template <typename T>
class TS_EXPORT Iterable
{
    TS_METHOD virtual Iterator<T>* iterator() = 0;
};

template <typename T>
class TS_EXPORT Entity : public Iterable<T>
{
public:
    TS_METHOD Entity();
    ~Entity();

    TS_METHOD TS_SIGNATURE("[Symbol.iterator](): EntityIterator<T>") TS_DECORATOR("MapTo('iterator')") TS_IGNORE Iterator<T>* iterator() override;
};

/*
}   // namespace snippets
}   // namespace global
*/



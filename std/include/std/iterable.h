#pragma once

#include <TS.h>

#include "std/private/options.h"

#include "std/tsboolean.h"

#include <type_traits>

template <typename T>
class TS_DECLARE IteratorResult
{
    static_assert(std::is_pointer<T>::value, "Expected IteratorResult's 'T' to be of pointer type");

public:
    IteratorResult(bool done, T value);

    TS_METHOD TS_GETTER Boolean* done() const;
    TS_METHOD TS_GETTER T value() const;

private:
    Boolean* _done = nullptr;
    T _value;
};

template <typename T>
IteratorResult<T>::IteratorResult(bool done, T value)
    : _done(new Boolean(done))
    , _value(value)
{
}

template <typename T>
Boolean* IteratorResult<T>::done() const
{
    return _done;
}

template <typename T>
T IteratorResult<T>::value() const
{
    return _value;
}

template <typename T>
class TS_DECLARE Iterator
{
    static_assert(std::is_pointer<T>::value, "Expected Iterator's 'T' to be of pointer type");

public:
    TS_METHOD virtual IteratorResult<T>* next() = 0;
};

template <typename T>
class TS_DECLARE Iterable
{
    static_assert(std::is_pointer<T>::value, "Expected Iterable's 'T' to be of pointer type");

public:
    TS_METHOD virtual Iterator<T>* iterator() = 0;
};

template <typename T>
class TS_DECLARE IterableIterator : public Iterator<T>
{
};

#pragma once

#include <TS.h>

#include "std/iterable.h"
#include "std/tsstring.h"
#include "std/tsnumber.h"

template <typename T>
class TS_DECLARE StringIterator : public IterableIterator<T>
{
public:
    StringIterator(String* iterable)
        : _iterable(iterable)
    {
    }

    TS_METHOD IteratorResult<T>* next() override
    {
        if (currentIndex == static_cast<size_t>(_iterable->length()->unboxed()))
        {
            return new IteratorResult<T>{true, {}};
        }

        T value = _iterable->operator[](currentIndex);
        ++currentIndex;

        return new IteratorResult<T>{false, value};
    }

private:
    String* _iterable = nullptr;
    size_t currentIndex = 0;
};
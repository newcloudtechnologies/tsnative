#pragma once

#include <TS.h>

#include <std/iterable.h>
#include <std/tsarray.h>

/*
error: redefinition of 'ArrayIterator'
*/

template <typename T>
class TS_EXPORT ArrayIterator : public IterableIterator<T>
{
public:
    ArrayIterator(Array<T>* iterable)
        : _iterable(iterable)
    {
    }

    TS_METHOD IteratorResult<T>* next() override
    {
        if (currentIndex == static_cast<size_t>(_iterable->length()->unboxed()))
        {
            auto result = new IteratorResult<T>{true, {}};
            return GC::track(result);
        }

        T value = _iterable->operator[](currentIndex);
        ++currentIndex;

        auto result = new IteratorResult<T>{false, value};
        return GC::track(result);
    }

private:
    Array<T>* _iterable = nullptr;
    size_t currentIndex = 0;
};

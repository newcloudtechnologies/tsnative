#pragma once

#include "std/iterable.h"
#include "std/array.h"

template <typename T>
class ArrayIterator : public IterableIterator<T>
{
public:
    ArrayIterator(Array<T>* iterable)
        : _iterable(iterable)
    {
    }

    IteratorResult<T>* next() override
    {
        if (currentIndex == static_cast<size_t>(_iterable->length()->valueOf()))
        {
            auto result = new IteratorResult<T>{true, {}};
            return GC::track(result);
        }

        T value = _iterable->operator[](GC::createHeapAllocated<Number>(currentIndex));
        ++currentIndex;

        auto result = new IteratorResult<T>{false, value};
        return GC::track(result);
    }

private:
    Array<T>* _iterable = nullptr;
    size_t currentIndex = 0;
};
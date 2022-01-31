#pragma once

#include "std/iterable.h"
#include "std/tsstring.h"

template <typename T>
class StringIterator : public IterableIterator<T>
{
public:
    StringIterator(String* iterable)
        : _iterable(iterable)
    {
    }

    IteratorResult<T>* next() override
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
    String* _iterable = nullptr;
    size_t currentIndex = 0;
};
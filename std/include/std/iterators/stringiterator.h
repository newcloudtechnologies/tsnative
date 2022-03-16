#pragma once

#include <TS.h>

#include <std/iterable.h>
#include <std/tsstring.h>

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
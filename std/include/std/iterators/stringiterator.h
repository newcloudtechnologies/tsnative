#pragma once

#include "std/iterable.h"
#include "std/stdstring.h"

template <typename T>
class StringIterator : public IterableIterator<T>
{
public:
    StringIterator(string* iterable)
        : _iterable(iterable)
    {
    }

    IteratorResult<T>* next() override
    {
        if (currentIndex == static_cast<size_t>(_iterable->length()))
        {
            auto result = new IteratorResult<T>{true, {}};
            return GC::track(result);
        }

        T value = _iterable->operator[](static_cast<double>(currentIndex));
        ++currentIndex;

        auto result = new IteratorResult<T>{false, value};
        return GC::track(result);
    }

private:
    string* _iterable = nullptr;
    size_t currentIndex = 0;
};
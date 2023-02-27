/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <TS.h>

#include "std/iterable.h"
#include "std/tsnumber.h"
#include "std/tsstring.h"

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
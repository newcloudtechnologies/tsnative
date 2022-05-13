/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
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

    TS_METHOD TS_SIGNATURE("[Symbol.iterator](): EntityIterator<T>")
        TS_DECORATOR("MapsTo('iterator')") Iterator<T>* iterator() override;
};

/*
}   // namespace snippets
}   // namespace global
*/

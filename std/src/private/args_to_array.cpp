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

#include "std/private/args_to_array.h"

#include "std/tstuple.h"

namespace
{
template <typename TCollection>
void addFlatten(const TCollection& what, Array<Object*>& where) noexcept
{
    const auto len = static_cast<std::size_t>(what.length()->unboxed());

    for (std::size_t i = 0; i < len; ++i)
    {
        Number index{static_cast<double>(i)};
        auto* element = static_cast<Object*>(what.operator[](&index));
        where.push(element);
    }
}
} // anonymous namespace

ArgsToArray::ArgsToArray(Array<Object*>* aggregator)
    : m_aggregator{aggregator}
{
    if (!m_aggregator)
    {
        throw std::runtime_error("Aggregator array is nullptr");
    }
}

void ArgsToArray::addObject(Object* nextArg, Boolean* isSpread)
{
    if (!nextArg || !isSpread)
    {
        return;
    }

    if (!(isSpread->unboxed()))
    {
        m_aggregator->push(nextArg);
        return;
    }

    if (nextArg->isArray())
    {
        const auto* array = static_cast<Array<Object*>*>(nextArg);
        addFlatten(*array, *m_aggregator);
    }
    else if (nextArg->isTuple())
    {
        const auto* tuple = static_cast<Tuple*>(nextArg);
        addFlatten(*tuple, *m_aggregator);
    }
    else
    {
        throw std::runtime_error("ArgsToArray::addObject: only arrays and tuples can be used as spread elements");
    }
}
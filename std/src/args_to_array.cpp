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

#include "std/args_to_array.h"

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

ArgsToArray::ArgsToArray(Array<Object*>* aggregator) noexcept
    : m_aggregator{*aggregator}
{
}

void ArgsToArray::addObject(Object* nextArg, Boolean* isSpread) noexcept
{
    if (!nextArg || !isSpread)
    {
        return;
    }

    if (nextArg->isArrayCpp() && isSpread->unboxed())
    {
        const auto* array = static_cast<Array<Object*>*>(nextArg);
        addFlatten(*array, m_aggregator);
        return;
    }

    if (nextArg->isTupleCpp() && isSpread->unboxed())
    {
        const auto* tuple = static_cast<Tuple*>(nextArg);
        addFlatten(*tuple, m_aggregator);
        return;
    }

    m_aggregator.push(nextArg);
}
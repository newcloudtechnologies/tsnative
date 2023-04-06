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
        std::cout << element->toString() << std::endl;
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

    LOG_INFO("ArgsToArray CTOR");
}

void ArgsToArray::addObject(Object* nextArg, Boolean* isSpread)
{
    LOG_INFO("ArgsToArray addObject call 1");

    if (!nextArg || !isSpread)
    {
        return;
    }

    LOG_INFO("ArgsToArray addObject call 2");
    LOG_INFO("ArgsToArray addObject call 3");

    if (!(isSpread->unboxed()))
    {
        LOG_INFO("ArgsToArray addObject call 5");
        m_aggregator->push(nextArg);
        LOG_INFO("ArgsToArray addObject call 6");
        return;
    }

    LOG_INFO("ArgsToArray addObject call 7");

    if (nextArg->isArray())
    {
        const auto* array = static_cast<Array<Object*>*>(nextArg);
        addFlatten(*array, *m_aggregator);

        std::cout << "Aggregator to str: " << std::endl;
        std::cout << m_aggregator->toString() << std::endl;
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
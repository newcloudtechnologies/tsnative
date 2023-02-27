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

#include "ts_object_cache.h"

#include <std/private/logger.h>
#include <std/tsnumber.h>

using namespace cpp_integration;

TSObjectOwner<Number> TSObjectCache::s_staticNumber = {};

TSObjectCache::TSObjectCache()
{
}

void TSObjectCache::addNumber(Number* num)
{
    m_numbers.emplace_back(make_object_owner(num));
}

void TSObjectCache::setClosure(TSClosure* closure)
{
    m_closure = make_object_owner(closure);
}

void TSObjectCache::setClassClosure(TSClosure* classClosure)
{
    m_classClosure = make_object_owner(classClosure);
}

Number* TSObjectCache::getNumbersSum() const
{
    double sum = 0.0;

    for (const auto& el : m_numbers)
    {
        sum += el->unboxed();
    }

    return new Number(sum);
}

void TSObjectCache::clear()
{
    m_numbers.clear();
}

String* TSObjectCache::getClosureString() const
{
    return m_closure->toString();
}

void TSObjectCache::callClassClosure()
{
    m_classClosure->call();
}

void TSObjectCache::setStaticNumber(Number* num)
{
    s_staticNumber = make_object_owner(num);
}
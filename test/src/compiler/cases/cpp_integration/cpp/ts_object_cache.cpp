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

void TSObjectCache::onClick(TSClosure* tsHandler)
{
    auto clickHandlerClosure = make_object_owner(tsHandler);
    m_button.onClick([clickHandlerClosure]() -> Number* { return static_cast<Number*>(clickHandlerClosure->call()); });
}

Number* TSObjectCache::click()
{
    return m_button.click();
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
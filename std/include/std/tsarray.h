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

#include "std/private/options.h"

#include "std/iterable.h"
#include "std/tsboolean.h"
#include "std/tsclosure.h"
#include "std/tsnumber.h"
#include "std/tsobject.h"
#include "std/tsstring.h"
#include "std/tsunion.h"

#ifdef USE_STD_ARRAY_BACKEND
#include "std/private/tsarray_std_p.h"
#endif

#include "std/private/logger.h"

#include <sstream>
#include <vector>

template <typename T>
class ArrayPrivate;

class ToStringConverter;

template <typename T>
class TS_DECLARE Array : public Iterable<T>
{
    static_assert(std::is_pointer<T>::value, "TS Array elements expected to be of pointer type");

public:
    TS_METHOD Array();
    // mkrv @todo: at least copy ctor
    ~Array() override;
    Array<String*>* getKeysArray() const override;

    static Array<T>* fromStdVector(const std::vector<T>& initializer)
    {
        auto array = new Array<T>{};

        for (const auto& value : initializer)
        {
            array->push(value);
        }

        return array;
    }

    TS_METHOD TS_SIGNATURE("push(...items: T[]): number") Number* push(Array<T>* v);

    inline void push(T v)
    {
        _d->push(v);
    }

    TS_METHOD void setElementAtIndex(Number* index, T value);

    TS_METHOD TS_GETTER Number* length() const;
    TS_METHOD TS_SETTER void length(Number* value);

    TS_METHOD TS_SIGNATURE("[index: number]: T") T operator[](Number* index) const;
    T operator[](size_t index) const;

    TS_METHOD TS_SIGNATURE(
        "forEach(callbackfn: (value: T, index: number, array: readonly T[]) => void): void") void forEach(TSClosure*
                                                                                                              closure)
        const;

    Number* indexOf(T value) const;
    TS_METHOD TS_SIGNATURE("indexOf(searchElement: T, fromIndex?: number): number") Number* indexOf(
        T value, Union* maybeFromIndex) const;

    // @todo: `map` have to be marked as `const`,
    // but somehow meta information have to be provided for code generator on TS side
    template <typename U>
    TS_METHOD TS_SIGNATURE("map<U>(callbackfn: (value: T, index: number, array: readonly T[]) => U): U[]")
        Array<U>* map(TSClosure* closure);

    TS_METHOD TS_SIGNATURE("splice(start: number, deleteCount?: number): T[]") Array<T>* splice(
        Number* start, Union* maybeDeleteCount);

    TS_METHOD TS_SIGNATURE("join(separator?: string|undefied): string") String* join(Union* maybeDelimiter) const;

    TS_METHOD TS_SIGNATURE("concat(other: T[]): T[]") Array<T>* concat(const Array<T>* other) const;

    std::vector<T> toStdVector() const;
    TS_METHOD String* toString() const override;

    TS_METHOD TS_SIGNATURE("[Symbol.iterator](): ArrayIterator<T>")
        TS_DECORATOR("MapsTo('iterator')") IterableIterator<T>* iterator() override;
    TS_METHOD TS_RETURN_TYPE("ArrayIterator<number>") IterableIterator<Number*>* keys();
    TS_METHOD TS_RETURN_TYPE("ArrayIterator<T>") IterableIterator<T>* values();

    std::vector<Object*> getChildObjects() const override;

private:
    ArrayPrivate<T>* _d = nullptr;

private:
    friend class ToStringConverter;
};

template <typename T>
class TS_DECLARE ArrayIterator : public IterableIterator<T>
{
public:
    TS_CODE("[Symbol.iterator](): Iterator<T>;")

    ArrayIterator(Array<T>* iterable)
        : _iterable(iterable)
    {
    }

    TS_METHOD IteratorResult<T>* next() override
    {
        if (currentIndex == static_cast<size_t>(_iterable->length()->unboxed()))
        {
            auto result = new IteratorResult<T>{true, {}};
            return result;
        }

        T value = _iterable->operator[](currentIndex);
        ++currentIndex;

        auto result = new IteratorResult<T>{false, value};
        return result;
    }

private:
    Array<T>* _iterable = nullptr;
    size_t currentIndex = 0;
};

// All the definitions placed in header to make it possible
// to create explicit instantiations using only include of this header.
template <typename T>
Array<T>::Array()
    : Iterable<T>(TSTypeID::Array)
#ifdef USE_STD_ARRAY_BACKEND
    , _d(new DequeueBackend<T>())
#endif
{
}

template <typename T>
Array<T>::~Array()
{
    delete _d;
}

template <typename T>
Number* Array<T>::push(Array<T>* other)
{
    auto iterator = other->iterator();
    auto result = iterator->next();

    while (!result->done()->unboxed())
    {
        push(result->value());
        result = iterator->next();
    }

    return length();
}

template <typename T>
Number* Array<T>::length() const
{
    const auto result = _d->length();
    return new Number(static_cast<double>(result));
}

template <typename T>
void Array<T>::length(Number* value)
{
    if (value->unboxed() < 0)
    {
        throw std::runtime_error("Invalid array length");
    }
    _d->length(static_cast<std::size_t>(value->unboxed()));
}

template <typename T>
T Array<T>::operator[](Number* index) const
{
    if (index->unboxed() < 0)
    {
        throw std::runtime_error("Invalid array index");
    }

    return _d->operator[](static_cast<std::size_t>(index->unboxed()));
}

template <typename T>
T Array<T>::operator[](size_t index) const
{
    return _d->operator[](index);
}

template <typename T>
void Array<T>::forEach(TSClosure* closure) const
{
    const auto numArgs = closure->getNumArgs()->unboxed();
    const auto length = _d->length();

    for (std::size_t i = 0; i < length; ++i)
    {
        if (numArgs > 0)
        {
            closure->setEnvironmentElement(operator[](i), 0);
        }

        if (numArgs > 1)
        {
            closure->setEnvironmentElement(new Number(static_cast<double>(i)), 1);
        }

        if (numArgs > 2)
        {
            closure->setEnvironmentElement(const_cast<Array<T>*>(this), 2);
        }

        closure->call();
    }
}

template <typename T>
Number* Array<T>::indexOf(T value, Union* maybeFromIndex) const
{
    int result = -1;
    if (!maybeFromIndex->hasValue())
    {
        result = _d->indexOf(value);
    }
    else
    {
        auto fromIndex = static_cast<Number*>(maybeFromIndex->getValue());
        result = _d->indexOf(value, static_cast<int>(fromIndex->unboxed()));
    }

    return new Number(static_cast<double>(result));
}

template <typename T>
String* Array<T>::join(Union* maybeDelimiter) const
{
    if (maybeDelimiter && maybeDelimiter->hasValue())
    {
        auto maybeVal = maybeDelimiter->getValue();
        if (maybeVal->isString())
        {
            auto delimiter = maybeVal->toString()->cpp_str();
            return new String(_d->join(delimiter));
        }
    }

    return new String(_d->join());
}

template <typename T>
Array<T>* Array<T>::splice(Number* start, Union* maybeDeleteCount)
{
    const auto integralStart = static_cast<int>(start->unboxed());
    const auto deleteCountValue = maybeDeleteCount->getValue();

    if (deleteCountValue->isUndefined())
    {
        return Array<T>::fromStdVector(_d->splice(integralStart));
    }
    else if (deleteCountValue->isBoolean())
    {
        const auto b = static_cast<const Boolean*>(deleteCountValue)->unboxed();
        if (!b)
        {
            return Array<T>::fromStdVector(std::vector<T>{});
        }
    }
    else if (!deleteCountValue->isNumber())
    {
        return Array<T>::fromStdVector(std::vector<T>{});
    }

    const auto integralDeleteCount = [deleteCountValue]() -> int
    {
        if (deleteCountValue->isBoolean())
        {
            return 1; // true bool
        }

        const auto n = static_cast<const Number*>(deleteCountValue);
        return static_cast<int>(n->unboxed());
    }();

    return Array<T>::fromStdVector(_d->splice(integralStart, integralDeleteCount));
}

template <typename T>
Array<T>* Array<T>::concat(const Array<T>* other) const
{
    return Array<T>::fromStdVector(_d->concat(other->toStdVector()));
}

template <typename T>
std::vector<T> Array<T>::toStdVector() const
{
    return _d->toStdVector();
}

template <typename T>
String* Array<T>::toString() const
{
    return join(nullptr);
}

template <typename T>
template <typename U>
Array<U>* Array<T>::map(TSClosure* closure)
{

    static_assert(std::is_pointer<U>::value, "TS Array elements expected to be of pointer type");

    auto transformedArray = new Array<U>();
    const auto numArgs = closure->getNumArgs()->unboxed();

    const auto length = _d->length();

    for (std::size_t i = 0; i < length; ++i)
    {
        if (numArgs > 0)
        {
            closure->setEnvironmentElement(operator[](i), 0);
        }

        if (numArgs > 1)
        {
            closure->setEnvironmentElement(new Number(static_cast<double>(i)), 1);
        }

        if (numArgs > 2)
        {
            closure->setEnvironmentElement(const_cast<Array<T>*>(this), 2);
        }

        U transformed = reinterpret_cast<U>(closure->call());
        transformedArray->push(transformed);
    }

    return transformedArray;
}

template <typename T>
void Array<T>::setElementAtIndex(Number* index, T value)
{
    const auto idx = index->unboxed();
    if (idx < 0)
    {
        throw std::runtime_error("Can not set value at negative index");
    }

    const auto unwrappedIndex = static_cast<std::size_t>(idx);
    _d->setElementAtIndex(unwrappedIndex, value);
}

template <typename T>
IterableIterator<T>* Array<T>::iterator()
{
    return new ArrayIterator<T>(this);
}

template <typename T>
IterableIterator<Number*>* Array<T>::keys()
{
    const auto keys = _d->keys();
    auto keysArray = new Array<Number*>();

    for (auto key : keys)
    {
        keysArray->push(new Number(static_cast<double>(key)));
    }

    return new ArrayIterator<Number*>(keysArray);
}

template <typename T>
IterableIterator<T>* Array<T>::values()
{
    return new ArrayIterator<T>(this);
}

template <typename T>
Array<String*>* Array<T>::getKeysArray() const
{
    auto result = new Array<String*>{};
    const auto keys = _d->keys();

    for (const auto k : keys)
    {
        auto n = new Number(k);
        result->push(n->toString());
    }

    return result;
}

template <typename T>
std::vector<Object*> Array<T>::getChildObjects() const
{
    auto result = Object::getChildObjects();
    const auto elements = _d->toStdVector();
    for (auto& e : elements)
    {
        auto* object = Object::asObjectPtr(e);
        if (object)
        {
            result.push_back(object);
        }
    }

    return result;
}

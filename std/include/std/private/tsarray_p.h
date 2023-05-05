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

#include "std/tsclosure.h"
#include "std/tsobject.h"

#include <functional>
#include <stdexcept>
#include <string>
#include <type_traits>
#include <vector>

template <typename T>
class ArrayPrivate
{
public:
    typedef bool SortComparator(const T& a, const T& b);

    virtual ~ArrayPrivate() = default;

    virtual std::size_t push(T v) = 0;

    virtual T pop() = 0;

    virtual std::size_t length() const = 0;
    virtual void length(std::size_t len) = 0;

    virtual bool empty() const = 0;

    virtual T operator[](std::size_t index) const = 0;

    virtual int indexOf(T value) const = 0;
    virtual int indexOf(T value, int fromIndex) const = 0;

    virtual std::vector<T> splice(int start) = 0;
    virtual std::vector<T> splice(int start, int deleteCount) = 0;

    virtual void sort(std::function<SortComparator> comparator) = 0;

    virtual std::vector<T> concat(const std::vector<T>& other) const = 0;

    virtual void setElementAtIndex(std::size_t index, T value) = 0;

    virtual std::vector<std::size_t> keys() const = 0;

    virtual std::vector<T> toStdVector() const = 0;

    virtual std::string join(const std::string& delimiter = ",") const = 0;
};

namespace impl
{

namespace sort
{

template <typename T>
std::function<typename ArrayPrivate<T>::SortComparator> makeDefaultComparator()
{
    return [](const T& a, const T& b)
    {
        auto* obj_a = Object::asObjectPtr(a);
        auto* obj_b = Object::asObjectPtr(b);

        if (!Object::isSameTypes(obj_a, obj_b))
        {
            throw std::runtime_error{"sort: all array's elements have to be of same type"};
        }

        // TODO: support default sort (without comparator) for other types
        if (obj_a->isBoolean() || obj_a->isNumber() || obj_a->isString() || obj_a->isArray())
        {
            std::string str_a = obj_a->toString()->cpp_str();
            std::string str_b = obj_b->toString()->cpp_str();
            return str_a < str_b;
        }
        else
        {
            // unsortable types
            return false;
        }
    };
}

template <typename T>
std::function<typename ArrayPrivate<T>::SortComparator> makeClosureBasedComparator(TSClosure* closure)
{
    if (!closure)
    {
        throw std::runtime_error{"sort: invalid comparator"};
    }

    return [closure](const T& a, const T& b)
    {
        closure->setEnvironmentElement(a, 0);
        closure->setEnvironmentElement(b, 1);
        auto* result = closure->call();

        if (!result)
        {
            throw std::runtime_error{"sort: compareFn returns null"};
        }

        auto* objectResult = static_cast<Object*>(result);

        if (!objectResult->isNumber())
        {
            throw std::runtime_error{"sort: compareFn must return Number"};
        }

        auto* numberResult = static_cast<Number*>(objectResult);

        return numberResult->operator<(0);
    };
}

} // namespace sort

} // namespace impl
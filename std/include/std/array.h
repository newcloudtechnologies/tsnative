#pragma once

#include <algorithm>
#include <cstdint>
#include <deque>
#include <iterator>
#include <numeric>
#include <vector>

#include "gc.h"
#include "iterable.h"
#include "stdstring.h"
#include "tsclosure.h"

#include "iterators/arrayiterator.h"

#include <iostream>
#include <sstream>

template <typename T>
class Array : public Iterable<T>
{
public:
    Array();

    static Array<T>* fromStdVector(const std::vector<T>& initializer)
    {
        Array<T>* array = new Array<T>;
        for (const auto& value : initializer)
        {
            array->storage_.push_back(value);
        }

        return GC::track(array);
    }

    double push(T v);

    template <typename... Ts>
    double push(T t, Ts... ts);

    double length() const;

    using SubscriptionReturnType = typename std::conditional<std::is_pointer<T>::value, T, T&>::type;
    typename Array::SubscriptionReturnType operator[](double index);

    void forEach(TSClosure* closure) const;

    double indexOf(T value) const;
    double indexOf(T value, double fromIndex) const;

    // @todo: `map` have to be marked as `const`,
    // but somehow meta information have to be provided for code generator on TS side
    template <typename U>
    Array<U>* map(TSClosure* closure);

    Array<T>* splice(double start);
    Array<T>* splice(double start, double deleteCount);

    Array<T>* concat(Array<T> const& other);

    string* toString();

    IterableIterator<T>* iterator() override;
    IterableIterator<double>* keys();
    IterableIterator<T>* values();

    template <typename U>
    friend std::ostream& operator<<(std::ostream& os, Array<U>* array);

private:
    template <typename U = T>
    typename std::enable_if<std::is_pointer<U>::value, U>::type getPointerToValue(size_t index) const
    {
        return storage_.at(index);
    }

    template <typename U = T>
    typename std::enable_if<!std::is_pointer<U>::value, U>::type* getPointerToValue(size_t index) const
    {
        U value = storage_.at(index);
        return GC::createHeapAllocated<U>(value);
    }

    template <typename U = T>
    typename std::enable_if<std::is_pointer<U>::value, U>::type getValue(void* untypedValue) const
    {
        return reinterpret_cast<U>(untypedValue);
    }

    template <typename U = T>
    typename std::enable_if<!std::is_pointer<U>::value, U>::type getValue(void* untypedValue) const
    {
        return *reinterpret_cast<U*>(untypedValue);
    }

    std::deque<T> storage_;
};

// All the definitions placed in header to make it possible
// to create explicit instantiations using only include of this header.
template <typename T>
Array<T>::Array()
{
}

template <typename T>
double Array<T>::push(T t)
{
    storage_.push_back(t);
    return storage_.size();
}

template <typename T>
double Array<T>::length() const
{
    return static_cast<double>(storage_.size());
}

template <typename T>
typename Array<T>::SubscriptionReturnType Array<T>::operator[](double index)
{
    return storage_.at(index);
}

template <typename T>
void Array<T>::forEach(TSClosure* closure) const
{
    for (size_t i = 0; i < storage_.size(); ++i)
    {
        if (closure->getNumArgs() > 0)
        {
            closure->setEnvironmentElement(getPointerToValue(i), 0);
        }

        if (closure->getNumArgs() > 1)
        {
            closure->setEnvironmentElement(GC::createHeapAllocated<double>(i), 1);
        }

        if (closure->getNumArgs() > 2)
        {
            closure->setEnvironmentElement(const_cast<Array<T>*>(this), 2);
        }

        closure->operator()();
    }
}

template <typename T>
double Array<T>::indexOf(T value) const
{
    return this->indexOf(value, 0);
}

template <typename T>
double Array<T>::indexOf(T value, double fromIndex) const
{
    int index = static_cast<int>(fromIndex);
    int length = static_cast<int>(this->length());

    if (index >= length)
    {
        return -1;
    }
    else if (index < 0 && abs(index) >= length)
    {
        index = 0;
    }
    else if (index > 0)
    {
        index = index > length - 1 ? length - 1 : index;
    }
    else if (index < 0)
    {
        index = index < -length - 1 ? -length - 1 : index;
        index = length + index;
    }

    auto it = std::find(storage_.cbegin() + index, storage_.cend(), value);

    if (it == storage_.cend())
    {
        return -1;
    }

    return std::distance(storage_.cbegin(), it);
}

template <typename T>
Array<T>* Array<T>::splice(double start)
{
    auto begin = (start >= 0 ? storage_.begin() : storage_.end()) + start;
    auto end = storage_.end();

    if (start < 0)
    {
        begin = std::max(begin, storage_.begin());
    }

    if (start >= 0 && begin >= end)
    {
        return {};
    }

    Array<T> removed;
    std::move(begin, end, std::back_inserter(removed.storage_));
    storage_.erase(begin, end);
    return GC::createHeapAllocated<Array<T>>(removed);
}

template <typename T>
Array<T>* Array<T>::splice(double start, double deleteCount)
{
    Array<T> removed;

    auto begin = (start >= 0 ? storage_.begin() : storage_.end()) + start;
    auto end = begin + deleteCount;

    if (start < 0)
    {
        begin = std::max(begin, storage_.begin());
    }

    end = std::min(begin + deleteCount, storage_.end());

    if (start >= 0 && begin >= end)
    {
        return GC::createHeapAllocated<Array<T>>(removed);
    }

    std::move(begin, end, std::back_inserter(removed.storage_));
    storage_.erase(begin, end);
    return GC::createHeapAllocated<Array<T>>(removed);
}

template <typename T>
Array<T>* Array<T>::concat(Array<T> const& other)
{
    Array<T> result;
    for (auto element : this->storage_)
    {
        result.push(element);
    }

    for (auto element : other.storage_)
    {
        result.push(element);
    }

    return GC::createHeapAllocated<Array<T>>(result);
}

template <typename T>
string* Array<T>::toString()
{
    std::ostringstream oss;
    oss << this;
    return GC::createHeapAllocated<string>(oss.str());
}

template <typename T>
template <typename U>
Array<U>* Array<T>::map(TSClosure* closure)
{
    Array<U> transformedArray;
    for (size_t i = 0; i < storage_.size(); ++i)
    {
        if (closure->getNumArgs() > 0)
        {
            closure->setEnvironmentElement(getPointerToValue(i), 0);
        }

        if (closure->getNumArgs() > 1)
        {
            closure->setEnvironmentElement(GC::createHeapAllocated<double>(i), 1);
        }

        if (closure->getNumArgs() > 2)
        {
            closure->setEnvironmentElement(const_cast<Array<T>*>(this), 2);
        }

        U transformed = getValue(closure->operator()());
        transformedArray.push(transformed);
    }

    return GC::createHeapAllocated<Array<U>>(transformedArray);
}

template <typename T>
template <typename... Ts>
double Array<T>::push(T t, Ts... ts)
{
    storage_.push_back(t);
    return push(ts...);
}

template <typename T>
IterableIterator<T>* Array<T>::iterator()
{
    auto it = new ArrayIterator<T>(this);
    return GC::track(it);
}

template <typename T>
IterableIterator<double>* Array<T>::keys()
{
    std::vector<double> indexes(storage_.size());
    std::iota(indexes.begin(), indexes.end(), 0);

    auto keysArray = Array<double>::fromStdVector(indexes);
    auto it = new ArrayIterator<double>(keysArray);
    return GC::track(it);
}

template <typename T>
IterableIterator<T>* Array<T>::values()
{
    auto it = new ArrayIterator<T>(this);
    return GC::track(it);
}

template <typename T>
inline std::ostream& operator<<(std::ostream& os, Array<T>* array)
{
    os << std::boolalpha;
    os << "[ ";
    if (!array->storage_.empty())
    {
        std::copy(array->storage_.cbegin(), array->storage_.cend() - 1, std::ostream_iterator<T>(os, ", "));
        os << array->storage_.back();
    }
    os << " ]";
    return os;
}

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
#include "tsnumber.h"

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

    Number* push(T v);

    template <typename... Ts>
    Number* push(T t, Ts... ts);

    Number* length() const;

    using SubscriptionReturnType = typename std::conditional<std::is_pointer<T>::value, T, T&>::type;
    typename Array::SubscriptionReturnType operator[](Number* index);

    void forEach(TSClosure* closure) const;

    Number* indexOf(T value) const;
    Number* indexOf(T value, Number* fromIndex) const;

    // @todo: `map` have to be marked as `const`,
    // but somehow meta information have to be provided for code generator on TS side
    template <typename U>
    Array<U>* map(TSClosure* closure);

    Array<T>* splice(Number* start);
    Array<T>* splice(Number* start, Number* deleteCount);

    Array<T>* concat(Array<T> const& other);

    string* toString();

    IterableIterator<T>* iterator() override;
    IterableIterator<Number*>* keys();
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
Number* Array<T>::push(T t)
{
    storage_.push_back(t);
    return GC::createHeapAllocated<Number>(storage_.size());
}

template <typename T>
Number* Array<T>::length() const
{
    return GC::createHeapAllocated<Number>(storage_.size());
}

template <typename T>
typename Array<T>::SubscriptionReturnType Array<T>::operator[](Number* index)
{
    return storage_.at(index->valueOf());
}

template <typename T>
void Array<T>::forEach(TSClosure* closure) const
{
    auto numArgs = closure->getNumArgs()->valueOf();

    for (size_t i = 0; i < storage_.size(); ++i)
    {
        if (numArgs > 0)
        {
            closure->setEnvironmentElement(getPointerToValue(i), 0);
        }

        if (numArgs > 1)
        {
            closure->setEnvironmentElement(GC::createHeapAllocated<Number>(i), 1);
        }

        if (numArgs > 2)
        {
            closure->setEnvironmentElement(const_cast<Array<T>*>(this), 2);
        }

        closure->operator()();
    }
}

template <typename T>
Number* Array<T>::indexOf(T value) const
{
    return this->indexOf(value, GC::createHeapAllocated<Number>(0.0));
}

template <typename T>
Number* Array<T>::indexOf(T value, Number* fromIndex) const
{
    int index = static_cast<int>(fromIndex->valueOf());
    int length = static_cast<int>(this->length()->valueOf());

    if (index >= length)
    {
        return GC::createHeapAllocated<Number>(-1);
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

    auto it = std::find_if(storage_.begin() + index, storage_.end(), [&value](T v) { return std::equal_to<T>()(v, value); });

    if (it == storage_.cend())
    {
        return GC::createHeapAllocated<Number>(-1);
    }

    return GC::createHeapAllocated<Number>(std::distance(storage_.cbegin(), it));
}

template <typename T>
Array<T>* Array<T>::splice(Number* start)
{
    auto startValue = start->valueOf();

    auto begin = (startValue >= 0 ? storage_.begin() : storage_.end()) + startValue;
    auto end = storage_.end();

    if (startValue < 0)
    {
        begin = std::max(begin, storage_.begin());
    }

    if (startValue >= 0 && begin >= end)
    {
        return {};
    }

    Array<T> removed;
    std::move(begin, end, std::back_inserter(removed.storage_));
    storage_.erase(begin, end);
    return GC::createHeapAllocated<Array<T>>(removed);
}

template <typename T>
Array<T>* Array<T>::splice(Number* start, Number* deleteCount)
{
    Array<T> removed;

    auto startValue = start->valueOf();
    auto deleteCountValue = deleteCount->valueOf();

    auto begin = (startValue >= 0 ? storage_.begin() : storage_.end()) + startValue;
    auto end = begin + deleteCountValue;

    if (startValue < 0)
    {
        begin = std::max(begin, storage_.begin());
    }

    end = std::min(begin + deleteCountValue, storage_.end());

    if (startValue >= 0 && begin >= end)
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
    auto numArgs = closure->getNumArgs()->valueOf();

    for (size_t i = 0; i < storage_.size(); ++i)
    {
        if (numArgs > 0)
        {
            closure->setEnvironmentElement(getPointerToValue(i), 0);
        }

        if (numArgs > 1)
        {
            closure->setEnvironmentElement(GC::createHeapAllocated<Number>(i), 1);
        }

        if (numArgs > 2)
        {
            closure->setEnvironmentElement(const_cast<Array<T>*>(this), 2);
        }

        U transformed = getValue<U>(closure->operator()());
        transformedArray.push(transformed);
    }

    return GC::createHeapAllocated<Array<U>>(transformedArray);
}

template <typename T>
template <typename... Ts>
Number* Array<T>::push(T t, Ts... ts)
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
IterableIterator<Number*>* Array<T>::keys()
{
    std::vector<double> indexes(storage_.size());
    std::iota(indexes.begin(), indexes.end(), 0);

    std::vector<Number*> boxedIndexes(indexes.size());
    std::transform(indexes.begin(), indexes.end(), boxedIndexes.end(), [](double v) { return new Number(v); });

    auto keysArray = Array<Number*>::fromStdVector(boxedIndexes);
    auto it = new ArrayIterator<Number*>(keysArray);
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

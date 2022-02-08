#pragma once

#include <algorithm>
#include <cstdint>
#include <deque>
#include <iterator>
#include <numeric>
#include <stdexcept>
#include <vector>

#include "std/gc.h"
#include "std/tsnumber.h"
#include "std/tsstring.h"

#include <sstream>

template <typename T>
class DequeueBackend
{
public:
    DequeueBackend();

    Number* push(T v);

    template <typename... Ts>
    Number* push(T t, Ts... ts);

    Number* length() const;
    void length(Number*);

    T operator[](Number* index) const;
    T operator[](size_t index) const;

    Number* indexOf(T value) const;
    Number* indexOf(T value, Number* fromIndex) const;

    std::vector<T> splice(Number* start);
    std::vector<T> splice(Number* start, Number* deleteCount);

    std::vector<T> concat(const Array<T>& other) const;

    String* toString() const;

    std::vector<double> keys() const;

    template <typename U>
    friend std::ostream& operator<<(std::ostream& os, DequeueBackend<U>* array);

private:
    std::deque<T> storage_;
};

template <typename T>
DequeueBackend<T>::DequeueBackend()
{
}

template <typename T>
Number* DequeueBackend<T>::push(T t)
{
    storage_.push_back(t);
    return GC::createHeapAllocated<Number>(storage_.size());
}

template <typename T>
Number* DequeueBackend<T>::length() const
{
    return GC::createHeapAllocated<Number>(storage_.size());
}

template <typename T>
void DequeueBackend<T>::length(Number* value)
{
    int64_t valueUnboxed = static_cast<int64_t>(value->unboxed());

    if (valueUnboxed < 0)
    {
        throw std::invalid_argument("Invalid array length");
    }

    auto size = storage_.size();

    if (valueUnboxed == size)
    {
        return;
    }

    if (valueUnboxed < size)
    {
        std::for_each(storage_.cbegin() + valueUnboxed, storage_.cend(), [](T v) { GC::untrack(v); });
    }

    storage_.resize(valueUnboxed);
}

template <typename T>
T DequeueBackend<T>::operator[](Number* index) const
{
    return storage_.at(static_cast<size_t>(index->unboxed()));
}

template <typename T>
T DequeueBackend<T>::operator[](size_t index) const
{
    return storage_.at(index);
}

template <typename T>
Number* DequeueBackend<T>::indexOf(T value) const
{
    return this->indexOf(value, GC::createHeapAllocated<Number>(0.0));
}

template <typename T>
Number* DequeueBackend<T>::indexOf(T value, Number* fromIndex) const
{
    int index = static_cast<int>(fromIndex->unboxed());
    int length = static_cast<int>(this->length()->unboxed());

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

    auto it =
        std::find_if(storage_.begin() + index, storage_.end(), [&value](T v) { return std::equal_to<T>()(v, value); });

    if (it == storage_.cend())
    {
        return GC::createHeapAllocated<Number>(-1);
    }

    return GC::createHeapAllocated<Number>(std::distance(storage_.cbegin(), it));
}

template <typename T>
std::vector<T> DequeueBackend<T>::splice(Number* start)
{
    auto startValue = start->unboxed();

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

    std::vector<T> removed;
    std::move(begin, end, std::back_inserter(removed));

    storage_.erase(begin, end);
    return removed;
}

template <typename T>
std::vector<T> DequeueBackend<T>::splice(Number* start, Number* deleteCount)
{
    std::vector<T> removed;

    auto startValue = start->unboxed();
    auto deleteCountValue = deleteCount->unboxed();

    auto begin = (startValue >= 0 ? storage_.begin() : storage_.end()) + startValue;
    auto end = begin + deleteCountValue;

    if (startValue < 0)
    {
        begin = std::max(begin, storage_.begin());
    }

    end = std::min(begin + deleteCountValue, storage_.end());

    if (startValue >= 0 && begin >= end)
    {
        return removed;
    }

    std::move(begin, end, std::back_inserter(removed));

    storage_.erase(begin, end);
    return removed;
}

template <typename T>
std::vector<T> DequeueBackend<T>::concat(const Array<T>& other) const
{
    std::vector<T> result;
    for (auto element : this->storage_)
    {
        result.push_back(element);
    }

    size_t otherLength = static_cast<size_t>(other.length()->unboxed());

    for (size_t i = 0; i < otherLength; ++i)
    {
        auto element = other[i];
        result.push_back(element);
    }

    return result;
}

template <typename T>
String* DequeueBackend<T>::toString() const
{
    std::ostringstream oss;
    oss << this;
    return GC::createHeapAllocated<String>(oss.str());
}

template <typename T>
template <typename... Ts>
Number* DequeueBackend<T>::push(T t, Ts... ts)
{
    storage_.push_back(t);
    return push(ts...);
}

template <typename T>
std::vector<double> DequeueBackend<T>::keys() const
{
    std::vector<double> indexes(storage_.size());
    std::iota(indexes.begin(), indexes.end(), 0);

    return indexes;
}

template <typename T>
inline std::ostream& operator<<(std::ostream& os, DequeueBackend<T>* array)
{
    os << std::boolalpha;
    os << "[ ";
    if (!array->storage_.empty())
    {
        std::for_each(array->storage_.cbegin(),
                      array->storage_.cend() - 1,
                      [&os](T value)
                      {
                          if (value)
                          {
                              os << value << ", ";
                          }
                          else
                          {
                              os << "null"
                                 << ", ";
                          }
                      });

        auto last = array->storage_.back();
        if (last)
        {
            os << last;
        }
        else
        {
            os << "null";
        }
    }
    os << " ]";
    return os;
}

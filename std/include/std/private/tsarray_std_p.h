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

#include "std/private/comparators.h"
#include "std/private/logger.h"
#include "std/private/tsarray_p.h"
#include "std/tsobject.h"

#include <algorithm>
#include <deque>
#include <iterator>
#include <numeric>
#include <sstream>
#include <vector>

template <typename T>
class DequeueBackend : public ArrayPrivate<T>
{
public:
    DequeueBackend() = default;
    ~DequeueBackend() = default;

    std::size_t push(T v) override;

    template <typename... Ts>
    std::size_t push(T t, Ts... ts);

    std::size_t length() const override;
    void length(std::size_t len) override;

    T operator[](std::size_t index) const override;

    int indexOf(T value) const override;
    int indexOf(T value, int fromIndex) const override;

    std::vector<T> splice(int start) override;
    std::vector<T> splice(int start, int deleteCount) override;

    void setElementAtIndex(std::size_t index, T value) override;

    std::vector<T> concat(const std::vector<T>& other) const override;
    std::vector<std::size_t> keys() const override;

    std::vector<T> toStdVector() const override;
    std::string toString() const override;

    template <typename U>
    friend std::ostream& operator<<(std::ostream& os, const DequeueBackend<U>* array);

private:
    std::vector<T> doSplice(std::size_t start, std::size_t deleteCount);
    std::size_t computeStartArgForSplice(int start) const;

private:
    std::deque<T> _storage;
};

template <typename T>
std::size_t DequeueBackend<T>::push(T t)
{
    _storage.push_back(t);
    return length();
}

template <typename T>
std::size_t DequeueBackend<T>::length() const
{
    return _storage.size();
}

template <typename T>
void DequeueBackend<T>::length(std::size_t len)
{
    if (_storage.size() == len)
    {
        return;
    }

    _storage.resize(len);
}

template <typename T>
T DequeueBackend<T>::operator[](std::size_t index) const
{
    return _storage.at(index);
}

template <typename T>
int DequeueBackend<T>::indexOf(T value) const
{
    return this->indexOf(value, 0);
}

template <typename T>
int DequeueBackend<T>::indexOf(T value, int fromIndex) const
{
    const auto len = length();

    std::size_t startIndex = 0u;

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
    if (fromIndex > 0)
    {
        startIndex = static_cast<std::size_t>(fromIndex);
        // If fromIndex >= array.length, the array is not searched and -1 is returned.
        if (startIndex >= len)
        {
            return -1;
        }
    }
    else if (fromIndex < 0)
    {
        // If fromIndex < -array.length or fromIndex is omitted, 0 is used, causing the entire array to be searched.
        const auto positiveFromIndex = static_cast<std::size_t>(-1 * fromIndex);
        if (positiveFromIndex >= len)
        {
            startIndex = 0;
        }
        // Negative index counts back from the end of the array — if fromIndex < 0, fromIndex + array.length is used.
        // Note, the array is still searched from front to back in this case.
        else
        {
            startIndex = len - positiveFromIndex;
        }
    }

    auto it = std::find_if(
        _storage.begin() + startIndex, _storage.end(), [&value](T v) { return std::equal_to<T>()(v, value); });

    if (it == _storage.cend())
    {
        return -1;
    }

    return static_cast<int>(std::distance(_storage.cbegin(), it));
}

template <typename T>
std::vector<T> DequeueBackend<T>::doSplice(std::size_t start, std::size_t deleteCount)
{
    auto beginIt = start > length() ? _storage.end() : (_storage.begin() + start);
    auto endIt = (start + deleteCount) > length() ? _storage.end() : (_storage.begin() + start + deleteCount);

    std::vector<T> removed(beginIt, endIt);
    _storage.erase(beginIt, endIt);

    return removed;
}

template <typename T>
std::size_t DequeueBackend<T>::computeStartArgForSplice(int start) const
{
    const auto positiveStart = static_cast<std::size_t>(std::abs(start));
    const auto len = length();

    if (start < 0)
    {
        // Negative index counts back from the end of the array — if start < 0, start + array.length is used.
        // If start < -array.length or start is omitted, 0 is used.
        return positiveStart < len ? len - positiveStart : 0u;
    }
    // If start >= array.length, no element will be deleted,
    // but the method will behave as an adding function, adding as many elements as provided.
    else if (positiveStart >= length())
    {
        // This case simply returns current vector because the signature does not have item1..itemN argument
        return len;
    }

    // 0u <= start < len
    return static_cast<std::size_t>(start);
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
template <typename T>
std::vector<T> DequeueBackend<T>::splice(int start)
{
    const auto begin = computeStartArgForSplice(start);
    // If deleteCount is omitted,
    // or if its value is greater than or equal to the number of elements after the position specified by start,
    // then all the elements from start to the end of the array will be deleted.
    const auto deleteCount = length() - begin;

    return doSplice(begin, deleteCount);
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
template <typename T>
std::vector<T> DequeueBackend<T>::splice(int start, int deleteCount)
{
    static const std::vector<T> emptyVector;

    // If deleteCount is 0 or negative, no elements are removed.
    // In this case, you should specify at least one new element (see below).
    if (deleteCount <= 0)
    {
        return emptyVector;
    }

    const auto unsignedStart = computeStartArgForSplice(start);

    const auto unsignedDeleteCount = [unsignedStart, deleteCount, this]() -> std::size_t
    {
        // If deleteCount is omitted, or if its value is greater than or equal to the number of elements
        // after the position specified by start,
        // then all the elements from start to the end of the array will be deleted.
        const auto unsignedDeleteCount = static_cast<std::size_t>(deleteCount);
        const auto elementsCountAfterBegin = length() - unsignedStart;

        return std::min(unsignedDeleteCount, elementsCountAfterBegin);
    }();

    return doSplice(unsignedStart, unsignedDeleteCount);
}

template <typename T>
void DequeueBackend<T>::setElementAtIndex(std::size_t index, T value)
{
    _storage[index] = value;
}

template <typename T>
std::vector<T> DequeueBackend<T>::concat(const std::vector<T>& other) const
{
    std::vector<T> result;
    result.reserve(this->_storage.size() + other.size());
    for (auto element : this->_storage)
    {
        result.push_back(element);
    }

    for (auto element : other)
    {
        result.push_back(element);
    }

    return result;
}

template <typename T>
std::vector<T> DequeueBackend<T>::toStdVector() const
{
    return {_storage.cbegin(), _storage.cend()};
}

template <typename T>
std::string DequeueBackend<T>::toString() const
{
    std::ostringstream oss;
    oss << this;
    return oss.str();
}

template <typename T>
template <typename... Ts>
std::size_t DequeueBackend<T>::push(T t, Ts... ts)
{
    _storage.push_back(t);
    return push(ts...);
}

template <typename T>
std::vector<std::size_t> DequeueBackend<T>::keys() const
{
    std::vector<std::size_t> indexes(_storage.size());
    std::iota(indexes.begin(), indexes.end(), 0u);

    return indexes;
}

template <typename T>
inline std::ostream& operator<<(std::ostream& os, const DequeueBackend<T>* array)
{
    os << std::boolalpha;
    os << "[ ";
    if (!array->_storage.empty())
    {
        std::for_each(array->_storage.cbegin(),
                      array->_storage.cend() - 1,
                      [&os](T value)
                      {
                          if (value)
                          {
                              os << Object::asObjectPtr(value)->toString()->cpp_str() << ", ";
                          }
                          else
                          {
                              os << "null"
                                 << ", ";
                          }
                      });

        auto last = array->_storage.back();
        if (last)
        {
            os << Object::asObjectPtr(last)->toString()->cpp_str();
        }
        else
        {
            os << "null";
        }
    }
    os << " ]";
    return os;
}

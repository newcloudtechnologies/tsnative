#pragma once

#include "std/tsobject.h"
#include "std/private/tsarray_p.h"

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

    int push(T v) override;

    template <typename... Ts>
    int push(T t, Ts... ts);

    int length() const override;
    void length(int len) override;

    T operator[](int index) const override;

    int indexOf(T value) const override;
    int indexOf(T value, int fromIndex) const override;

    std::vector<T> splice(int start) override;
    std::vector<T> splice(int start, int deleteCount) override;

    std::vector<T> concat(const std::vector<T>& other) const override;
    std::vector<int> keys() const override;

    std::vector<T> toStdVector() const override;
    std::string toString() const override;

    template <typename U>
    friend std::ostream& operator<<(std::ostream& os, const DequeueBackend<U>* array);

private:
    std::deque<T> storage_;
};

template <typename T>
int DequeueBackend<T>::push(T t)
{
    storage_.push_back(t);
    return length();
}

template <typename T>
int DequeueBackend<T>::length() const
{
    return static_cast<int>(storage_.size());
}

template <typename T>
void DequeueBackend<T>::length(int len)
{
    if (len < 0)
    {
        throw std::invalid_argument("Invalid array length");
    }

    auto size = storage_.size();

    if (len == size)
    {
        return;
    }

    storage_.resize(len);
}

template <typename T>
T DequeueBackend<T>::operator[](int index) const
{
    return storage_.at(static_cast<size_t>(index));
}

template <typename T>
int DequeueBackend<T>::indexOf(T value) const
{
    return this->indexOf(value, 0);
}

template <typename T>
int DequeueBackend<T>::indexOf(T value, int fromIndex) const
{
    if (fromIndex >= length())
    {
        return -1;
    }
    else if (fromIndex < 0 && abs(fromIndex) >= length())
    {
        fromIndex = 0;
    }
    else if (fromIndex > 0)
    {
        fromIndex = fromIndex > length() - 1 ? length() - 1 : fromIndex;
    }
    else if (fromIndex < 0)
    {
        fromIndex = fromIndex < -length() - 1 ? -length() - 1 : fromIndex;
        fromIndex = length() + fromIndex;
    }

    auto it = std::find_if(
        storage_.begin() + fromIndex, storage_.end(), [&value](T v) { return std::equal_to<T>()(v, value); });

    if (it == storage_.cend())
    {
        return -1;
    }

    return static_cast<int>(std::distance(storage_.cbegin(), it));
}

template <typename T>
std::vector<T> DequeueBackend<T>::splice(int start)
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

    std::vector<T> removed;
    std::move(begin, end, std::back_inserter(removed));

    storage_.erase(begin, end);
    return removed;
}

template <typename T>
std::vector<T> DequeueBackend<T>::splice(int start, int deleteCount)
{
    std::vector<T> removed;

    auto begin = (start >= 0 ? storage_.begin() : storage_.end()) + start;
    auto end = begin + deleteCount;

    if (start < 0)
    {
        begin = std::max(begin, storage_.begin());
    }

    end = std::min(begin + deleteCount, storage_.end());

    if (start >= 0 && begin >= end)
    {
        return removed;
    }

    std::move(begin, end, std::back_inserter(removed));

    storage_.erase(begin, end);
    return removed;
}

template <typename T>
std::vector<T> DequeueBackend<T>::concat(const std::vector<T>& other) const
{
    std::vector<T> result;
    for (auto element : this->storage_)
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
    return {storage_.cbegin(), storage_.cend()};
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
int DequeueBackend<T>::push(T t, Ts... ts)
{
    storage_.push_back(t);
    return push(ts...);
}

template <typename T>
std::vector<int> DequeueBackend<T>::keys() const
{
    std::vector<int> indexes(storage_.size());
    std::iota(indexes.begin(), indexes.end(), 0);

    return indexes;
}

template <typename T>
inline std::ostream& operator<<(std::ostream& os, const DequeueBackend<T>* array)
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
                              os << static_cast<Object*>(value)->toString() << ", ";
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
            os << static_cast<Object*>(last)->toString();
        }
        else
        {
            os << "null";
        }
    }
    os << " ]";
    return os;
}

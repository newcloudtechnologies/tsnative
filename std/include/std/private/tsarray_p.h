#pragma once

#include <type_traits>
#include <vector>

template <typename T>
class ArrayPrivate
{
    static_assert(std::is_pointer<T>::value, "Array elements expected to be a pointers");

public:
    virtual ~ArrayPrivate() = default;

    virtual int push(T v) = 0;

    virtual int length() const = 0;
    virtual void length(int len) = 0;

    virtual T operator[](int index) const = 0;

    virtual int indexOf(T value) const = 0;
    virtual int indexOf(T value, int fromIndex) const = 0;

    virtual std::vector<T> splice(int start) = 0;
    virtual std::vector<T> splice(int start, int deleteCount) = 0;

    virtual std::vector<T> concat(const std::vector<T>& other) const = 0;

    virtual std::vector<int> keys() const = 0;

    virtual std::vector<T> toStdVector() const = 0;
    virtual std::string toString() const = 0;
};

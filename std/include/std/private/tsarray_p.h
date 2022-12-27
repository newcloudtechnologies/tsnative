/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <type_traits>
#include <vector>

template <typename T>
class ArrayPrivate
{
public:
    virtual ~ArrayPrivate() = default;

    virtual std::size_t push(T v) = 0;

    virtual std::size_t length() const = 0;
    virtual void length(std::size_t len) = 0;

    virtual T operator[](std::size_t index) const = 0;

    virtual int indexOf(T value) const = 0;
    virtual int indexOf(T value, int fromIndex) const = 0;

    virtual std::vector<T> splice(int start) = 0;
    virtual std::vector<T> splice(int start, int deleteCount) = 0;

    virtual std::vector<T> concat(const std::vector<T>& other) const = 0;

    virtual void setElementAtIndex(std::size_t index, T value) = 0;

    virtual std::vector<std::size_t> keys() const = 0;

    virtual std::vector<T> toStdVector() const = 0;
    virtual std::string toString() const = 0;
};

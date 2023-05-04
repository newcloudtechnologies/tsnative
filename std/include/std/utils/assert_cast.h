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

#include <stdexcept>
#include <string>
#include <typeinfo>

class Object;

class BadCast final : public std::runtime_error
{
    using runtime_error::runtime_error;
};

// Safe cast + check. Throw exception in case of failed convertation.
// Note: doesn't work with rest arguments ( https://jira.ncloudtech.ru:8090/browse/TSN-594 )
template <class T>
T assertCast(Object* obj)
{
    auto casted = dynamic_cast<T>(obj);
    if (!casted)
    {
        std::string errorText = std::string("Assert cast: Could not convert object to type ") + typeid(T).name();
        throw BadCast(errorText);
    }
    return casted;
}

template <class T>
T assertCast(const Object* obj)
{
    auto casted = dynamic_cast<T>(obj);
    if (!casted)
    {
        std::string errorText = std::string("Assert cast: Could not convert const object to type ") + typeid(T).name();
        throw BadCast(errorText);
    }
    return casted;
}
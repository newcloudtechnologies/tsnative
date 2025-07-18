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
// Note: doesn't work with rest arguments (TODO TSN-594)
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
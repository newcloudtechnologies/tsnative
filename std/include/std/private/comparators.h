#pragma once

#include "../tsboolean.h"
#include "../tsnumber.h"
#include "../tsstring.h"

namespace std
{
template <>
struct equal_to<::Number*>
{
    bool operator()(::Number* const& lhs, ::Number* const& rhs) const
    {
        // TODO double-s should not be compared like this
        return lhs->unboxed() == rhs->unboxed();
    }
};

template <>
struct hash<::String*>
{
    size_t operator()(::String* s) const
    {
        return hash<string>()(s->cpp_str());
    }
};

template <>
struct equal_to<::String*>
{
    bool operator()(::String* const& lhs, ::String* const& rhs) const
    {
        return lhs->cpp_str() == rhs->cpp_str();
    }
};

template <>
struct equal_to<::Boolean*>
{
    bool operator()(::Boolean* const& lhs, ::Boolean* const& rhs) const
    {
        return lhs->unboxed() == rhs->unboxed();
    }
};
} // namespace std

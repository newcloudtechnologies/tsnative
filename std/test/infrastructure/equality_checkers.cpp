#include "equality_checkers.h"

bool operator == (const std::string& lhs, const String* rhs)
{
    if (!rhs)
    {
        return false;
    }

    return lhs == rhs->cpp_str();
}

bool operator == (const String* lhs, const std::string& rhs)
{
    return rhs == lhs;
}
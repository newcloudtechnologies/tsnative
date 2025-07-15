#pragma once

#include <string>
#include <unordered_set>

class Object;

class ToStringConverter
{
public:
    static std::string convert(const Object* obj);

private:
    using Visited = std::unordered_set<const Object*>;

    static std::string convertWithCheck(const Object* obj, Visited& visited);

    template <typename O>
    static std::string toString(const O*, Visited& visited);
};
#pragma once

#include "std/private/options.h"

#include "std/iterable.h"
#include "std/tsboolean.h"

#include <ostream>
#include <string>

template <typename T>
class Array;
class Number;

class StringPrivate;

class String : public Iterable<String*>
{
public:
    String();
    String(Number* d);
    String(const int8_t* s);
    String(const std::string& s);
    String(const char* s);

    Number* length() const;
    String* concat(String* other) const;

    Boolean* startsWith(String* other) const;
    Boolean* startsWith(String* other, Number* startIndex) const;

    Boolean* endsWith(String* other) const;
    Boolean* endsWith(String* other, Number* startIndex) const;

    Array<String*>* split(String* pattern) const;
    Array<String*>* split(String* pattern, Number* limit) const;

    String* slice(Number* startIndex) const;
    String* slice(Number* startIndex, Number* endIndex) const;

    String* substring(Number* startIndex) const;
    String* substring(Number* startIndex, Number* endIndex) const;

    String* trim() const;

    String* toLowerCase() const;
    String* toUpperCase() const;

    Boolean* includes(String* pattern) const;
    Boolean* includes(String* pattern, Number* startIndex) const;

    Number* indexOf(String* pattern) const;
    Number* indexOf(String* pattern, Number* startIndex) const;

    Number* lastIndexOf(String* pattern) const;
    Number* lastIndexOf(String* pattern, Number* startIndex) const;

    Boolean* equals(String* other) const;

    String* operator[](Number* index) const;
    String* operator[](size_t index) const;

    Boolean* toBool() const;

    std::string cpp_str() const;

    IterableIterator<String*>* iterator() override;

    String* clone() const;

    friend std::ostream& operator<<(std::ostream& os, String* s);

private:
    StringPrivate* _d = nullptr;
};

inline std::ostream& operator<<(std::ostream& os, String* s)
{
    os << s->cpp_str();
    return os;
}

namespace std
{
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
        return lhs->equals(rhs)->unboxed();
    }
};

} // namespace std
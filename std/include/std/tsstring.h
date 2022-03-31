#pragma once

#include "std/private/options.h"

#include "std/iterable.h"
#include "std/tsboolean.h"
#include "std/tsobject.h"

#include <ostream>
#include <string>

template <typename T>
class Array;
class Number;
class Union;

class StringPrivate;

class String : public Object, public Iterable<String*>
{
public:
    String();
    String(Number* d);
    String(const int8_t* s);
    String(const std::string& s);
    String(const char* s);

protected:
    ~String() override;

public:
    Number* length() const;
    String* concat(String* other) const;

    Boolean* startsWith(String* other, Union* maybeStartIndex) const;
    Boolean* endsWith(String* other, Union* maybeStartIndex) const;

    Array<String*>* split(String* pattern, Union* maybeLimit) const;

    String* slice(Number* startIndex, Union* maybeEndIndex) const;

    String* substring(Number* startIndex, Union* maybeEndIndex) const;

    String* trim() const;

    String* toLowerCase() const;
    String* toUpperCase() const;

    Boolean* includes(String* pattern, Union* maybeStartIndex) const;

    Number* indexOf(String* pattern, Union* maybeStartIndex) const;
    Number* lastIndexOf(String* pattern, Union* maybeStartIndex) const;

    Boolean* equals(String* other) const;

    String* operator[](Number* index) const;
    String* operator[](size_t index) const;

    String* toString() const override;
    Boolean* toBool() const override;

    std::string cpp_str() const;

    IterableIterator<String*>* iterator() override;

    String* clone() const;

private:
    StringPrivate* _d = nullptr;
};

inline std::ostream& operator<<(std::ostream& os, const String* s)
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
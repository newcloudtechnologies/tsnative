#pragma once

#include <TS.h>

#include "std/private/options.h"

#include "std/iterable.h"
#include "std/tsboolean.h"

#include <ostream>
#include <string>

template <typename T>
class Array;
class Number;

class StringPrivate;

class TS_EXPORT String : public Iterable<String*>
{
public:
    TS_METHOD TS_SIGNATURE("constructor(_: any)") String();
    String(Number* d);
    String(const int8_t* s);
    String(const std::string& s);
    String(const char* s);

    TS_METHOD TS_GETTER Number* length() const;
    TS_METHOD String* concat(String* other) const;

    Boolean* startsWith(String* other) const;
    TS_METHOD Boolean* startsWith(String* other, Number* startIndex) const;

    Boolean* endsWith(String* other) const;
    TS_METHOD Boolean* endsWith(String* other, Number* startIndex) const;

    Array<String*>* split(String* pattern) const;
    TS_METHOD TS_RETURN_TYPE("string[]") Array<String*>* split(String* pattern, Number* limit) const;

    String* slice(Number* startIndex) const;
    TS_METHOD String* slice(Number* startIndex, Number* endIndex) const;

    String* substring(Number* startIndex) const;
    TS_METHOD String* substring(Number* startIndex, Number* endIndex) const;

    TS_METHOD String* trim() const;

    TS_METHOD String* toLowerCase() const;
    TS_METHOD String* toUpperCase() const;

    Boolean* includes(String* pattern) const;
    TS_METHOD Boolean* includes(String* pattern, Number* startIndex) const;

    Number* indexOf(String* pattern) const;
    TS_METHOD Number* indexOf(String* pattern, Number* startIndex) const;

    Number* lastIndexOf(String* pattern) const;
    TS_METHOD Number* lastIndexOf(String* pattern, Number* startIndex) const;

    TS_METHOD Boolean* equals(String* other) const;

    String* operator+(String* other) const;

    String* operator[](Number* index) const;
    String* operator[](size_t index) const;

    TS_METHOD Boolean* toBool() const;

    std::string cpp_str() const;

    TS_METHOD TS_RETURN_TYPE("StringIterator<string>") TS_DECORATOR("MapsTo('iterator')") TS_IGNORE IterableIterator<String*>* iterator() override;

    TS_METHOD String* clone() const;

    friend std::ostream& operator<<(std::ostream& os, String* s);

private:
    StringPrivate* _d = nullptr;
};

TS_CODE(
    "// @ts-ignore\n"
    "declare type string = String;\n"
);

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

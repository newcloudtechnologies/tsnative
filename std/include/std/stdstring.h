#pragma once

#include "iterable.h"
#include "tsnumber.h"

#include <iostream>
#include <string>

template <typename T>
class Array;

class string : public Iterable<string*>
{
public:
    string();
    string(Number* d);
    string(const int8_t* s);
    string(const std::string& s);
    string(const char* s);

    Number* length() const;
    string* concat(const string& other) const;

    bool startsWith(const string& other) const;
    bool startsWith(const string& other, Number* startIndex) const;

    bool endsWith(const string& other) const;
    bool endsWith(const string& other, Number* startIndex) const;

    Array<string*>* split(const string& pattern) const;
    Array<string*>* split(const string& pattern, Number* limit) const;

    string* slice(Number* startIndex) const;
    string* slice(Number* startIndex, Number* endIndex) const;

    string* substring(Number* startIndex) const;
    string* substring(Number* startIndex, Number* endIndex) const;

    string* trim() const;

    string* toLowerCase() const;
    string* toUpperCase() const;

    bool includes(const string& pattern) const;
    bool includes(const string& pattern, Number* startIndex) const;

    Number* indexOf(const string& pattern) const;
    Number* indexOf(const string& pattern, Number* startIndex) const;

    Number* lastIndexOf(const string& pattern) const;
    Number* lastIndexOf(const string& pattern, Number* startIndex) const;

    bool operator==(const string& other) const;
    bool operator==(string* other) const;
    string* operator+(const string& other) const;

    string* operator[](Number* index) const;

    std::string cpp_str() const;

    IterableIterator<string*>* iterator() override;

    friend std::ostream& operator<<(std::ostream& os, const string& s);
    friend std::ostream& operator<<(std::ostream& os, string* s);

private:
    std::string string_;
};

inline std::ostream& operator<<(std::ostream& os, const string& s)
{
    os << s.string_;
    return os;
}

inline std::ostream& operator<<(std::ostream& os, string* s)
{
    os << s->string_;
    return os;
}

namespace std
{
template <>
struct hash<::string*>
{
    size_t operator()(::string* s) const
    {
        return hash<string>()(s->cpp_str());
    }
};

template <>
struct equal_to<::string*>
{
    bool operator()(::string* const& lhs, ::string* const& rhs) const
    {
        return *lhs == *rhs;
    }
};

} // namespace std
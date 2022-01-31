#pragma once

#include <string>

#include "std/tsarray.h"
#include "std/tsboolean.h"
#include "std/tsnumber.h"

class StdStringBackend
{
public:
    StdStringBackend();
    StdStringBackend(const std::string& s);

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

    String* operator+(String* other) const;

    String* operator[](Number* index) const;
    String* operator[](size_t index) const;

    Boolean* toBool() const;

    std::string cpp_str() const;

private:
    std::string _string;
};

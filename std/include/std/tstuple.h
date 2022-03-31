#pragma once

#include "std/private/options.h"

#include "std/tsobject.h"

#include <sstream>

template <typename T>
class Array;

class String;
class Number;

class Tuple : public Object
{
public:
    Tuple();
    ~Tuple() override;

    Number* length() const;
    void* operator[](Number* index);
    void* operator[](int index);

    void push(Object* item);

    String* toString() const override;

    friend std::ostream& operator<<(std::ostream& os, const Tuple* tuple);

private:
    Array<Object*>* _d = nullptr;
};

inline std::ostream& operator<<(std::ostream& os, const Tuple* tuple)
{
    os << tuple->_d;
    return os;
}

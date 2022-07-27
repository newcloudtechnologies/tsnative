#pragma once

#include <TS.h>

#include "std/private/options.h"
#include "std/tsobject.h"

#include <sstream>

template <typename T>
class Array;

class String;
class Number;

class TS_DECLARE Tuple : public Object
{
public:
    TS_METHOD Tuple();

    TS_METHOD TS_GETTER Number* length() const;
    TS_METHOD TS_SIGNATURE("[index: number]: any") void* operator[](Number* index);
    void* operator[](int index);

    TS_METHOD TS_SIGNATURE("push(item: Object): void") void push(Object* item);

    TS_METHOD String* toString() const override;

    friend std::ostream& operator<<(std::ostream& os, const Tuple* tuple);

    void markChildren() override;

private:
    Array<Object*>* _d = nullptr;
};

inline std::ostream& operator<<(std::ostream& os, const Tuple* tuple)
{
    os << tuple->_d;
    return os;
}

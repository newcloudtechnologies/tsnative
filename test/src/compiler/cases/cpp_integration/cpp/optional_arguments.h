#pragma once

#include <TS.h>

#include <std/tsobject.h>

class Number;
class String;
class Union;

namespace cpp_integration IS_TS_MODULE
{
class TS_EXPORT WithOptionalArgs : public Object
{
public:
    TS_METHOD TS_SIGNATURE("constructor(n: number, s?: string)") WithOptionalArgs(Number* n, Union* s);

    TS_METHOD TS_SIGNATURE("setValues(n?: number, s?: string): void") void setValues(Union* n, Union* s);

    TS_METHOD TS_SIGNATURE("setMoreValues(n?: number, s?: string, ...items: number[]): void") void setMoreValues(
        Union* n, Union* s, Array<Number*>* items);

    TS_METHOD void setString(String* s);

    TS_METHOD Number* getNumber() const;
    TS_METHOD String* getString() const;

    TS_METHOD Number* getDefaultNumber() const;
    TS_METHOD String* getDefaultString() const;

    TS_METHOD Array<Number*>* getItems() const;
};
} // namespace IS_TS_MODULE

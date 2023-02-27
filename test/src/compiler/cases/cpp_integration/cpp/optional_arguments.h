/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

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

    TS_METHOD void setString(String* s);

    TS_METHOD Number* getNumber() const;
    TS_METHOD String* getString() const;

    TS_METHOD Number* getDefaultNumber() const;
    TS_METHOD String* getDefaultString() const;
};
} // namespace IS_TS_MODULE

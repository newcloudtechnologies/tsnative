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

#include "std/private/options.h"
#include "std/tsobject.h"

#include <sstream>

template <typename T>
class ArrayPrivate;

class String;
class Number;
class ToStringConverter;

class TS_DECLARE Tuple : public Object
{
public:
    TS_METHOD Tuple();
    ~Tuple() override;

    TS_METHOD TS_GETTER Number* length() const;
    TS_METHOD TS_SIGNATURE("[index: number]: any") void* operator[](Number* index) const;
    void* operator[](int index) const;

    TS_METHOD TS_SIGNATURE("push(item: Object): void") void push(Object* item);

    TS_METHOD void setElementAtIndex(Number* index, Object* value);

    TS_METHOD String* toString() const override;

    std::vector<Object*> getChildObjects() const override;

private:
    ArrayPrivate<Object*>* _d = nullptr;

private:
    friend class ToStringConverter;
};

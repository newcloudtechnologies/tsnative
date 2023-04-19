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

#include "dummy_base.h"

#include <std/tsnumber.h>
#include <std/tsobject.h>
#include <std/tsstring.h>

#include <cstdint>

namespace cpp_integration IS_TS_MODULE
{

TS_CODE("import { Base } from 'test'")

class TS_EXPORT VirtualBase : public Object
{
public:
    TS_METHOD VirtualBase();
    virtual ~VirtualBase() = default;

    TS_METHOD virtual const String* virtualMethod() const;
    TS_METHOD virtual const Number* pureVirtualMethodToOverride() const = 0;

private:
    String* s = new String{"base virtual method"};
};

class TS_EXPORT DerivedFromVirtualBase : public VirtualBase
{
public:
    TS_METHOD DerivedFromVirtualBase();
    ~DerivedFromVirtualBase() override = default;

    TS_METHOD const Number* pureVirtualMethodToOverride() const override;

private:
    Number i{324};
};

class TS_EXPORT DerivedFromBaseInOtherNamespace : public test::Base
{
public:
    TS_METHOD DerivedFromBaseInOtherNamespace();
};

class TS_EXPORT CXXBase : public Object
{
public:
    TS_METHOD CXXBase();
    ~CXXBase();

    TS_METHOD Number* getNumber() const;
    TS_METHOD String* callMemberClosure() const;

private:
    int* dummyField1 = new int(1);
    int* dummyField2 = new int(2);
};

class OnlyCpp
{
public:
    void callme(){};

    int n = 999;
};

class TS_EXPORT Worker : public Object
{
public:
    TS_METHOD Worker();
    ~Worker() override;

    TS_METHOD void someMethod();

private:
    OnlyCpp* cppClass = nullptr;
};

} // namespace IS_TS_MODULE

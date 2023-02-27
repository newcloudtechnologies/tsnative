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

#include "inheritance.h"

#include <std/tsclosure.h>

using namespace cpp_integration;

VirtualBase::VirtualBase()
{
}
const String* VirtualBase::virtualMethod() const
{
    return s;
}

DerivedFromVirtualBase::DerivedFromVirtualBase()
{
}
const Number* DerivedFromVirtualBase::pureVirtualMethodToOverride() const
{
    return &i;
}

DerivedFromBaseInOtherNamespace::DerivedFromBaseInOtherNamespace()
{
}

CXXBase::CXXBase()
{
}
CXXBase::~CXXBase()
{
    delete dummyField1;
    delete dummyField2;
}

Number* CXXBase::getNumber() const
{
    return get<Number*>("n");
}

String* CXXBase::callMemberClosure() const
{
    auto* closure = get<TSClosure*>("m");
    String* result = static_cast<String*>(closure->call());

    return result->concat(new String("CXX"));
}

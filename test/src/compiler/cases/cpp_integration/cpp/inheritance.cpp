#include "inheritance.h"

#include <iostream>
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

Worker::Worker()
    : cppClass(new OnlyCpp())
{
}

Worker::~Worker()
{
    delete cppClass;
}

void Worker::someMethod()
{
    cppClass->callme();

    // Access property to check if memory valid; std::cout to prevent compiler optimizations
    std::cout << cppClass->n << std::endl;
}

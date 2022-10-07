#include "inheritance.h"

#include <std/gc.h>
#include <std/tsclosure.h>

using namespace cpp;

VirtualBase::VirtualBase() {}
const String *VirtualBase::virtualMethod() const { return s; }

DerivedFromVirtualBase::DerivedFromVirtualBase() {}
const Number *DerivedFromVirtualBase::pureVirtualMethodToOverride() const
{
  return &i;
}

DerivedFromBaseInOtherNamespace::DerivedFromBaseInOtherNamespace() {}

CXXBase::CXXBase() {}
CXXBase::~CXXBase()
{
  delete dummyField1;
  delete dummyField2;
}

Number *CXXBase::getNumber() const
{
  return get<Number *>("n");
}

String *CXXBase::callMemberClosure() const
{
  auto *closure = get<TSClosure *>("m");
  String *result = static_cast<String *>(closure->call());

  return result->concat(new String("CXX"));
}

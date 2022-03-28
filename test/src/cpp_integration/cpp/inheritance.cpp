#include "inheritance.h"

#include <std/gc.h>

using namespace cpp;

VirtualBase::VirtualBase() {}
const String *VirtualBase::virtualMethod() const { return s; }

DerivedFromVirtualBase::DerivedFromVirtualBase() {}
const Number *DerivedFromVirtualBase::pureVirtualMethodToOverride() const
{
  return &i;
}

DerivedFromBaseInOtherNamespace::DerivedFromBaseInOtherNamespace() {}
#pragma once

#include <cstdint>

#include "dummy_base.h"

#include <std/tsstring.h>
#include <std/tsnumber.h>
#include <std/tsobject.h>

namespace cpp
{
  class VirtualBase : public Object
  {
  public:
    VirtualBase();
    virtual ~VirtualBase() = default;

    virtual const String *virtualMethod() const;
    virtual const Number *pureVirtualMethodToOverride() const = 0;

  private:
    String *s = new String{"base virtual method"};
  };

  class DerivedFromVirtualBase : public VirtualBase
  {
  public:
    DerivedFromVirtualBase();
    ~DerivedFromVirtualBase() override = default;

    const Number *pureVirtualMethodToOverride() const override;

  private:
    Number i{324};
  };

  class DerivedFromBaseInOtherNamespace : public test::Base
  {
  public:
    DerivedFromBaseInOtherNamespace();
  };

  class CXXBase : public Object
  {
  public:
    CXXBase();
    ~CXXBase();

    Number *getNumber() const;
    String *callMemberClosure() const;

  private:
    int* dummyField1 = new int(1);
    int* dummyField2 = new int(2);
  };

} // namespace cpp

#include <cstdint>

#include <std/gc.h>
#include <std/tsstring.h>
#include <std/tsobject.h>

template <typename T, typename R>
R sum(T op1, T op2) { return op1 + op2; }

template <>
Number *sum(Number *op1, Number *op2)
{
  return op1->add(op2);
}

template <>
Number *sum(String *op1, String *op2)
{
  return op1->length()->add(op2->length());
}

namespace NS
{
  namespace innerNS
  {
    template <typename T>
    T getGenericNumber();

    template <>
    Number *getGenericNumber() { return GC::track(new Number(42)); }
    template <>
    String *getGenericNumber()
    {
      return GC::track(new String("forty two"));
    }

  } // namespace innerNS
} // namespace NS

class ClassWithTemplateMethod : public Object
{
public:
  ClassWithTemplateMethod();

  template <typename T>
  typename std::enable_if<std::is_same<T, Number *>::value, T>::type
  getWithAdditionOfTwo(T v) const
  {
    return v->add(GC::track(new Number(2)));
  }

  template <typename T>
  typename std::enable_if<std::is_same<T, String *>::value, T>::type
  getWithAdditionOfTwo(T v) const
  {
    return v->concat(GC::track(new String("_2")));
  }
};

ClassWithTemplateMethod::ClassWithTemplateMethod() {}

template Number *ClassWithTemplateMethod::getWithAdditionOfTwo(Number *) const;
template String *ClassWithTemplateMethod::getWithAdditionOfTwo(String *) const;

template <typename FirstMemberType, typename SecondMemberType>
class ClassWithTemplateMembers : public Object
{
public:
  ClassWithTemplateMembers(FirstMemberType value);

  FirstMemberType getFirst() const;
};

template <typename FirstMemberType, typename SecondMemberType>
ClassWithTemplateMembers<FirstMemberType, SecondMemberType>::
    ClassWithTemplateMembers(FirstMemberType value)
{
  set("first", value);
}

template <typename FirstMemberType, typename SecondMemberType>
FirstMemberType
ClassWithTemplateMembers<FirstMemberType, SecondMemberType>::getFirst() const
{
  return get<FirstMemberType>("first");
}

template class ClassWithTemplateMembers<Number *, String *>;
template class ClassWithTemplateMembers<String *, String *>;

template <typename T>
class TemplateClassWithTemplateMethod : public Object
{
public:
  TemplateClassWithTemplateMethod(T transformBase);

  template <typename U>
  typename std::enable_if<
      std::is_same<U, Number *>::value && std::is_same<T, Number *>::value, U>::type
  transform(U value) const
  {
    auto transformBase = get<T>("transformBase");
    return value->add(transformBase);
  }

  template <typename U>
  typename std::enable_if<std::is_same<U, String *>::value &&
                              std::is_same<T, Number *>::value,
                          U>::type
  transform(U value) const
  {
    auto transformBase = get<T>("transformBase");
    return value->concat(transformBase->toString());
  }
};

template <typename T>
TemplateClassWithTemplateMethod<T>::TemplateClassWithTemplateMethod(
    T transformBase)
{
  set("transformBase", transformBase);
}

template class TemplateClassWithTemplateMethod<Number *>;
template Number *
TemplateClassWithTemplateMethod<Number *>::transform(Number *) const;
template String *
TemplateClassWithTemplateMethod<Number *>::transform(String *) const;

/*
class MyClass {
public:
  MyClass();

  template <typename T> string concat(const string &s, T value) const;
};

MyClass::MyClass() {}

template <> string MyClass::concat(const string &s, const string &value) const
{ return s.concat(value);
}

template <> string MyClass::concat(const string &s, double value) const {
  return s.concat(std::to_string(value));
}

template string MyClass::concat(const string &, double) const;
template string MyClass::concat(const string &, const string &) const;

*/

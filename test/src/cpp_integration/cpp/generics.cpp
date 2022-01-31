#include <cstdint>

#include <std/gc.h>
#include <std/stdstring.h>

template <typename T, typename R>
R sum(T op1, T op2) { return op1 + op2; }

template <>
Number *sum(Number *op1, Number *op2)
{
  return op1->add(op2);
}

template <>
Number *sum(const string &op1, const string &op2)
{
  return op1.length()->add(op2.length());
}

namespace NS
{
  namespace innerNS
  {
    template <typename T>
    T getGenericNumber();

    template <>
    Number *getGenericNumber() { return GC::createHeapAllocated<Number>(42); }
    template <>
    string *getGenericNumber()
    {
      return GC::createHeapAllocated<string>("forty two");
    }

  } // namespace innerNS
} // namespace NS

class ClassWithTemplateMethod
{
public:
  ClassWithTemplateMethod();

  template <typename T>
  typename std::enable_if<std::is_same<T, Number *>::value, T>::type
  getWithAdditionOfTwo(T v) const
  {
    return v->add(GC::createHeapAllocated<Number>(2));
  }

  template <typename T>
  typename std::enable_if<std::is_same<T, string *>::value, T>::type
  getWithAdditionOfTwo(T v) const
  {
    return v->concat("_2");
  }
};

ClassWithTemplateMethod::ClassWithTemplateMethod() {}

template Number *ClassWithTemplateMethod::getWithAdditionOfTwo(Number *) const;
template string *ClassWithTemplateMethod::getWithAdditionOfTwo(string *) const;

template <typename FirstMemberType, typename SecondMemberType>
class ClassWithTemplateMembers
{
public:
  ClassWithTemplateMembers(FirstMemberType value);

  FirstMemberType get() const;

private:
  // intentionally out of template parameters order
  SecondMemberType m_1;
  FirstMemberType m_2;
};

template <typename FirstMemberType, typename SecondMemberType>
ClassWithTemplateMembers<FirstMemberType, SecondMemberType>::
    ClassWithTemplateMembers(FirstMemberType value)
    : m_2(value) {}

template <typename FirstMemberType, typename SecondMemberType>
FirstMemberType
ClassWithTemplateMembers<FirstMemberType, SecondMemberType>::get() const
{
  return m_2;
}

template class ClassWithTemplateMembers<Number *, string *>;
template class ClassWithTemplateMembers<string *, string *>;

template <typename T>
class TemplateClassWithTemplateMethod
{
public:
  TemplateClassWithTemplateMethod(T transformBase);

  template <typename U>
  typename std::enable_if<
      std::is_same<U, Number *>::value && std::is_same<T, Number *>::value, U>::type
  transform(U value) const
  {
    return value->add(_transformBase);
  }

  template <typename U>
  typename std::enable_if<std::is_same<U, string *>::value &&
                              std::is_same<T, Number *>::value,
                          U>::type
  transform(U value) const
  {
    return value->concat(std::to_string(_transformBase->valueOf()));
  }

private:
  T _transformBase;
};

template <typename T>
TemplateClassWithTemplateMethod<T>::TemplateClassWithTemplateMethod(
    T transformBase)
    : _transformBase(transformBase) {}

template class TemplateClassWithTemplateMethod<Number *>;
template Number *
TemplateClassWithTemplateMethod<Number *>::transform(Number *) const;
template string *
TemplateClassWithTemplateMethod<Number *>::transform(string *) const;

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

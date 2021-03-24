#include <cstdint>

#include <std-typescript-llvm/include/gc.h>
#include <std-typescript-llvm/include/stdstring.h>

template <typename T, typename R> R sum(T op1, T op2) { return op1 + op2; }

template double sum(double, double);

template <> int32_t sum(const string &op1, const string &op2) {
  return op1.length() + op2.length();
}

namespace NS {
namespace innerNS {
template <typename T> T getGenericNumber();

template <> int8_t getGenericNumber() { return 1; }
template <> double getGenericNumber() { return 42; }
template <> string *getGenericNumber() {
  return GC::createHeapAllocated<const string, string>("forty two");
}

} // namespace innerNS
} // namespace NS

class ClassWithTemplateMethod {
public:
  ClassWithTemplateMethod();

  template <typename T>
  typename std::enable_if<std::is_same<T, double>::value, T>::type
  getWithAdditionOfTwo(T v) const {
    return v + 2;
  }

  template <typename T>
  typename std::enable_if<std::is_same<T, string *>::value, T>::type
  getWithAdditionOfTwo(T v) const {
    return GC::createHeapAllocated<const string &, string>(v->concat("_2"));
  }
};

ClassWithTemplateMethod::ClassWithTemplateMethod() {}

template double ClassWithTemplateMethod::getWithAdditionOfTwo(double) const;
template string *ClassWithTemplateMethod::getWithAdditionOfTwo(string *) const;

template <typename FirstMemberType, typename SecondMemberType>
class ClassWithTemplateMembers {
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
ClassWithTemplateMembers<FirstMemberType, SecondMemberType>::get() const {
  return m_2;
}

template class ClassWithTemplateMembers<double, string *>;
template class ClassWithTemplateMembers<string *, string *>;

template <typename T> class TemplateClassWithTemplateMethod {
public:
  TemplateClassWithTemplateMethod(T transformBase);

  template <typename U>
  typename std::enable_if<
      std::is_same<U, double>::value && std::is_same<T, double>::value, U>::type
  transform(U value) const {
    return value + _transformBase;
  }

  template <typename U>
  typename std::enable_if<std::is_same<U, string *>::value &&
                              std::is_same<T, double>::value,
                          U>::type
  transform(U value) const {
    return GC::createHeapAllocated<const string &, string>(
        value->concat(std::to_string(_transformBase)));
  }

private:
  T _transformBase;
};

template <typename T>
TemplateClassWithTemplateMethod<T>::TemplateClassWithTemplateMethod(
    T transformBase)
    : _transformBase(transformBase) {}

template class TemplateClassWithTemplateMethod<double>;
template double
TemplateClassWithTemplateMethod<double>::transform(double) const;
template string *
TemplateClassWithTemplateMethod<double>::transform(string *) const;

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

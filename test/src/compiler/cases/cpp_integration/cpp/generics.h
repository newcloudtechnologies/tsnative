/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
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

#include <cstdint>

#include <std/tsnumber.h>
#include <std/tsobject.h>
#include <std/tsstring.h>

namespace cpp_integration IS_TS_MODULE
{

/*
template <typename T, typename R>
R TS_EXPORT sum(T op1, T op2)
{
    return op1 + op2;
}

template <>
Number* TS_EXPORT sum(Number* op1, Number* op2)
{
    return op1->add(op2);
}

template <>
Number* TS_EXPORT sum(String* op1, String* op2)
{
    return op1->length()->add(op2->length());
}
*/

namespace innerNS IS_TS_NAMESPACE
{
template <typename T>
TS_EXPORT T getGenericNumber();

} // namespace IS_TS_NAMESPACE

class TS_EXPORT ClassWithTemplateMethod : public Object
{
public:
    TS_METHOD ClassWithTemplateMethod();

    TS_CODE("getWithAdditionOfTwo<T>(value: T): T")

    template <typename T>
    typename std::enable_if<std::is_same<T, Number*>::value, T>::type getWithAdditionOfTwo(T v) const
    {
        return v->add(new Number(2));
    }

    template <typename T>
    typename std::enable_if<std::is_same<T, String*>::value, T>::type getWithAdditionOfTwo(T v) const
    {
        return v->concat(new String("_2"));
    }
};

template Number* ClassWithTemplateMethod::getWithAdditionOfTwo(Number*) const;
template String* ClassWithTemplateMethod::getWithAdditionOfTwo(String*) const;

template <typename FirstMemberType, typename SecondMemberType>
class TS_EXPORT ClassWithTemplateMembers : public Object
{
public:
    TS_METHOD ClassWithTemplateMembers(FirstMemberType value);

    TS_METHOD FirstMemberType getFirst() const;
};

template <typename FirstMemberType, typename SecondMemberType>
ClassWithTemplateMembers<FirstMemberType, SecondMemberType>::ClassWithTemplateMembers(FirstMemberType value)
{
    set("first", value);
}

template <typename FirstMemberType, typename SecondMemberType>
FirstMemberType ClassWithTemplateMembers<FirstMemberType, SecondMemberType>::getFirst() const
{
    return get<FirstMemberType>("first");
}

template class ClassWithTemplateMembers<Number*, String*>;
template class ClassWithTemplateMembers<String*, String*>;

template <typename T>
class TS_EXPORT TemplateClassWithTemplateMethod : public Object
{
public:
    TS_METHOD TemplateClassWithTemplateMethod(T transformBase);

    TS_CODE("transform<U>(value: U): U;")

    template <typename U>
    typename std::enable_if<std::is_same<U, Number*>::value && std::is_same<T, Number*>::value, U>::type transform(
        U value) const
    {
        auto transformBase = get<T>("transformBase");
        return value->add(transformBase);
    }

    template <typename U>
    typename std::enable_if<std::is_same<U, String*>::value && std::is_same<T, Number*>::value, U>::type transform(
        U value) const
    {
        auto transformBase = get<T>("transformBase");
        return value->concat(transformBase->toString());
    }
};

template <typename T>
TemplateClassWithTemplateMethod<T>::TemplateClassWithTemplateMethod(T transformBase)
{
    set("transformBase", transformBase);
}

template class TemplateClassWithTemplateMethod<Number*>;
template Number* TemplateClassWithTemplateMethod<Number*>::transform(Number*) const;
template String* TemplateClassWithTemplateMethod<Number*>::transform(String*) const;

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
} // namespace IS_TS_MODULE

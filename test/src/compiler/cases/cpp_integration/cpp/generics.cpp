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

#include "generics.h"

namespace cpp_integration
{
namespace innerNS
{

template <>
Number* getGenericNumber()
{
    return new Number(42);
}

template <>
String* getGenericNumber()
{
    return new String("forty two");
}

} // namespace innerNS

ClassWithTemplateMethod::ClassWithTemplateMethod()
{
}

} // namespace cpp_integration
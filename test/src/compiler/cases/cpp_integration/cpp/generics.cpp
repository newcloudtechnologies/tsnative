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
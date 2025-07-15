#include "nested_namespaces.h"

using namespace cpp_integration;

N2::Clazz::Clazz()
{
}

void N2::takesClazz(Clazz* c)
{
    (void)c;
};
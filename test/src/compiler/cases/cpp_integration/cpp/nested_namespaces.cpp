/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "nested_namespaces.h"

using namespace cpp_integration;

N2::Clazz::Clazz()
{
}

void N2::takesClazz(Clazz* c)
{
    (void)c;
};
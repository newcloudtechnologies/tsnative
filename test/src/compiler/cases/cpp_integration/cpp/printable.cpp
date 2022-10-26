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

#include "printable.h"

using namespace cpp_integration;

Printable::Printable(Point* point, String* s)
{
    set("point", point->clone());
    set("string", s->clone());
}

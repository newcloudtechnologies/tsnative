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

#include "std/parse_int.h"
#include "std/tsnumber.h"
#include "std/tsstring.h"
#include "std/tsunion.h"

Number* parseInt(String* str, Union* radix)
{
    return Number::parseInt(str, radix);
}
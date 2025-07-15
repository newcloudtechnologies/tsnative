#include "std/parse_int.h"
#include "std/tsnumber.h"
#include "std/tsstring.h"
#include "std/tsunion.h"

Number* parseInt(String* str, Union* radix)
{
    return Number::parseInt(str, radix);
}
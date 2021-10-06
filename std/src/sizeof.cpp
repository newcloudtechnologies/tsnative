#include "std/sizeof.h"

#include "std/array.h"
#include "std/stdstring.h"
#include "std/tsclosure.h"

uint32_t SizeOf::array()
{
    return sizeof(Array<void*>);
}

uint32_t SizeOf::string()
{
    return sizeof(::string);
}

uint32_t SizeOf::closure()
{
    return sizeof(TSClosure);
}
#include "sizeof.h"

#include "array.h"
#include "stdstring.h"
#include "tsclosure.h"

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
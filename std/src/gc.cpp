#include "gc.h"

#include <cstdlib>

void* GC::allocate(uint32_t numBytes)
{
    return malloc(numBytes);
}

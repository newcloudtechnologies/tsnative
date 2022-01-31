#include "std/gc.h"

#include <cstdlib>

void* GC::allocate(double numBytes)
{
    return malloc(static_cast<size_t>(numBytes));
}

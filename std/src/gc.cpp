#include "std/gc.h"

#include <cstdlib>

void* GC::allocate(Number* numBytes)
{
    return malloc(static_cast<size_t>(numBytes->valueOf()));
}

void* GC::allocate(double numBytes)
{
    return malloc(static_cast<size_t>(numBytes));
}

void* GC::allocate(size_t numBytes)
{
    return malloc(numBytes);
}

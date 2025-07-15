#include "union_narrowing.h"

#include "std/tsnumber.h"

using namespace cpp_integration;

UnionTest::UnionTest()
{
}

Number* UnionTest::bypass(Number* n) const
{
    return n;
}

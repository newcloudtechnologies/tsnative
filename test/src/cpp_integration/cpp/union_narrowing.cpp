#include "std/tsobject.h"
#include "std/tsnumber.h"

namespace cpp
{
    class UnionTest : public Object
    {
        UnionTest();

        Number *bypass(Number *n) const;
    };

    UnionTest::UnionTest() {}

    Number *UnionTest::bypass(Number *n) const
    {
        return n;
    }
}

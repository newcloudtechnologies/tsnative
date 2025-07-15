#include <TS.h>

#include "std/tsobject.h"

class Number;

namespace cpp_integration IS_TS_MODULE
{
class TS_EXPORT UnionTest : public Object
{
    TS_METHOD UnionTest();

    TS_METHOD Number* bypass(Number* n) const;
};
} // namespace IS_TS_MODULE

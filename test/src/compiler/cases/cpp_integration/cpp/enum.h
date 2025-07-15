#include <TS.h>

#include "std/tsobject.h"

namespace cpp_integration IS_TS_MODULE
{
enum TS_EXPORT E
{
    Auto = 0,
    Manual
};

class TS_EXPORT EnumArgs : public Object
{
    TS_METHOD EnumArgs(E e);

    TS_METHOD E test(E e) const;
};

} // namespace IS_TS_MODULE
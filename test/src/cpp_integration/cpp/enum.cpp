#include "std/tsobject.h"

namespace cpp
{
    enum E
    {
        Auto = 0,
        Manual
    };

    class EnumArgs : public Object
    {
        EnumArgs(E e);

        E test(E e) const;
    };

    EnumArgs::EnumArgs(E e) {}

    E EnumArgs::test(E e) const
    {
        return e;
    }
}
#pragma once

#include <std/tsobject.h>

class Number;
class String;
class Union;

namespace cpp
{
    class WithOptionalArgs : public Object
    {
    public:
        WithOptionalArgs(Number *n, Union *s);

        void setValues(Union *n, Union *s);

        Number *getNumber() const;
        String *getString() const;

        Number *getDefaultNumber() const;
        String *getDefaultString() const;
    };
} // namespace cpp

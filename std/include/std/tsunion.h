#pragma once

#include <TS.h>

#include "std/tsobject.h"
#include "std/tsstring.h"
#include "std/tsundefined.h"

#include <ostream>

class Boolean;

class TS_DECLARE Union : public Object
{
public:
    Union();
    TS_METHOD TS_SIGNATURE("constructor(initializer?: any)") Union(Object* value);

protected:
    ~Union() override = default;

public:
    TS_METHOD Object* getValue() const;
    TS_METHOD void setValue(Object* value);

    bool hasValue();

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

private:
    Object* _value = new Undefined();
};

inline std::ostream& operator<<(std::ostream& os, const Union* v)
{
    os << v->toString();
    return os;
}

#pragma once

#include "std/tsobject.h"
#include "std/tsstring.h"
#include "std/tsundefined.h"

#include <ostream>

class Boolean;

class Union : public Object
{
public:
    Union();
    Union(Object* value);

protected:
    ~Union() override = default;

public:
    Object* getValue() const;
    void setValue(Object* value);

    bool hasValue();

    String* toString() const override;
    Boolean* toBool() const override;

private:
    Object* _value = new Undefined();
};

inline std::ostream& operator<<(std::ostream& os, const Union* v)
{
    os << v->toString();
    return os;
}

#pragma once

#include <TS.h>

#include "std/tsobject.h"
#include "std/tsstring.h"
#include "std/tsundefined.h"

#include "std/utils/assert_cast.h"
#include "std/utils/attributes.h"

#include <ostream>

class Boolean;
class ToStringConverter;

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

    template <typename T>
    T INLINE_ATTR getValue() const
    {
        static_assert(std::is_pointer<T>::value &&
                      std::is_base_of<Object, typename std::remove_pointer<T>::type>::value);
        return assertCast<T>(_value);
    }

    bool hasValue();

    std::vector<Object*> getChildObjects() const override;

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;
    TS_METHOD Boolean* equals(Object* other) const override;

private:
    Object* _value = Undefined::instance();

private:
    friend class ToStringConverter;
};

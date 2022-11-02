/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

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

    template <typename T>
    T getValue() const
    {
        static_assert(std::is_pointer<T>::value &&
                      std::is_base_of<Object, typename std::remove_pointer<T>::type>::value);
        return static_cast<T>(_value);
    }

    bool hasValue();

    void markChildren() override;

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

private:
    Object* _value = Undefined::instance();
};

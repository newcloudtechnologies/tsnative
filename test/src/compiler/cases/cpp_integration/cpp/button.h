/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
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

#include <std/tsobject.h>

class TSClosure;

namespace cpp_integration IS_TS_MODULE
{
class Point;

class TS_EXPORT Button : public Object
{
public:
    TS_METHOD Button();

    TS_METHOD void onClicked(TSClosure* closure);
    TS_METHOD void onClickedWithPoint(TSClosure* closure);

    TS_METHOD void click() const;
    TS_METHOD void clickWithPoint(Point* point) const;
};

} // namespace IS_TS_MODULE
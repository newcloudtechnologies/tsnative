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
#pragma once

#include <TS.h>
#include <std/tsobject.h>

#include "details/internal_include4.h"

namespace poc IS_TS_MODULE
{

namespace exts IS_TS_NAMESPACE
{

class TS_EXPORT MyWidget : public mgt::ts::Widget
{
public:
    TS_METHOD MyWidget(mgt::ts::Widget* parent);
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE

#pragma once

#include <TS.h>

#include "details/internal_include2.h"

namespace mgt IS_TS_MODULE
{

namespace exts IS_TS_NAMESPACE
{

class TS_EXPORT MyWidget : public ts::Widget
{
public:
    TS_METHOD MyWidget(mgt::ts::Widget& parent);
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE

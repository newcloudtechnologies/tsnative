#pragma once

#include "TS.h"
#include <std/tsobject.h>

namespace mgt
{
namespace widgets
{
class WidgetFramework;
}
} // namespace mgt

namespace mgt IS_TS_MODULE
{

namespace widgets IS_TS_NAMESPACE
{

class TS_EXPORT WidgetFramework : public Object
{
public:
    TS_METHOD WidgetFramework() = default;
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE

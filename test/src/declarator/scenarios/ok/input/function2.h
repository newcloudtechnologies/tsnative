#pragma once

#include <TS.h>
#include <std/tsnumber.h>

namespace global IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

TS_EXPORT Number* pi();

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE

Number* global::snippets::pi()
{
    return nullptr;
    //    return 3.14;
}

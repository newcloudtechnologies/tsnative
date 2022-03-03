#pragma once

#include <TS.h>
#include <std/tsnumber.h>

namespace global IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

TS_EXPORT Number pi();

}   // namespace snippets
}   // namespace global

Number global::snippets::pi()
{
    return 3.14;
}

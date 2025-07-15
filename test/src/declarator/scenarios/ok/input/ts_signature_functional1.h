#pragma once

#include <TS.h>
#include <std/tsarray.h>
#include <std/tsnumber.h>
#include <std/tsobject.h>
#include <std/tspromise.h>
#include <std/tsunion.h>

TS_EXPORT TS_SIGNATURE("function finally2(onFinally?: () => void): Promise") Promise* finally2(Union* onFinally);
TS_EXPORT TS_SIGNATURE("function finally3(onFinally?: (_: any) => void): Promise") Promise* finally3(Union* onFinally);

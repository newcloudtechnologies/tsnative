#pragma once

#include "TS.h"
#include "std/tsnumber.h"

TS_EXPORT Number* getNumber();

TS_EXPORT TS_NAME("capacity") Number* getCapacity();
TS_EXPORT TS_NAME("capacity") void setCapacity(Number* value);

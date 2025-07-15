#pragma once

#include <TS.h>
#include <std/tsnumber.h>

// Test case for TSN-85 TS_DECLARE is ignored for standalone functions
TS_DECLARE void clearTimeout(Number* handle);
TS_EXPORT TS_DECLARE void createTimeout(Number* handle);

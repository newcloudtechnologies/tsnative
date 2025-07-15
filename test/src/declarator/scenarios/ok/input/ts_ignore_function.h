#pragma once

#include <TS.h>
#include <std/tsclosure.h>
#include <std/tsnumber.h>
#include <std/tsobject.h>

// Test case for TSN-85 TS_IGNORE is ignored for standalone functions
TS_IGNORE TS_DECLARE Number* setTimeout(TSClosure* handler, Number* timeout);

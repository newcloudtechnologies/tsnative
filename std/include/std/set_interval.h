/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <TS.h>

class TSClosure;
class Number;

TS_CODE("// @ts-ignore")
// @todo: AN-1173
TS_CODE("declare function setInterval(handler: TSClosure, timeout: number): number;");
Number* setInterval(TSClosure* handler, Number* interval);

// @todo: AN-1173
TS_CODE("declare function clearInterval(handle: number): void;");
void clearInterval(Number* handle);

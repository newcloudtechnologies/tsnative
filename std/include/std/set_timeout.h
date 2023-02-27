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
TS_CODE("declare function setTimeout(handler: TSClosure, timeout: number): number;")
Number* setTimeout(TSClosure* handler, Number* timeout);

// @todo: AN-1173
TS_CODE("declare function clearTimeout(handle: number): void;")
void clearTimeout(Number* handle);

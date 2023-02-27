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

TS_CODE("let str: string = \"Hello world\";\n");

TS_CODE("const division2 = function (x: number, y: number): number {\n"
        "let result = x;\n"
        "result /= y;\n"
        "return result;\n"
        "}\n");

TS_CODE("@MapsTo(\"operator==\")\n");

TS_CODE("// @ts-ignore\n"
        "@MapsTo(\"operator==\")\n"
        "private equals(string): boolean;\n");

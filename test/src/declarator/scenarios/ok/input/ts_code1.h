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

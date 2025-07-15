#pragma once

#include <TS.h>

class Number;
class String;
class Union;

TS_CODE("declare function parseInt(s: string, radix?: number): number;")
Number* parseInt(String* str, Union* radix);

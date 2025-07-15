#pragma once

#include <TS.h>

class Number;
class String;

TS_CODE("declare function parseFloat(s: string): number;")
Number* parseFloat(String* str);
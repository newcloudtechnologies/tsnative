#pragma once

#include "std/tsstring.h"

#include <string>

bool operator==(const std::string& lhs, const String* rhs);
bool operator==(const String* lhs, const std::string& rhs);
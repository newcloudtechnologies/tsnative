#pragma once

#include <TS.h>

#include <string>
#include <vector>

class TS_EXPORT Collection
{
public:
    TS_METHOD Collection() = default;

    TS_METHOD TS_RETURN_TYPE("Array<string>") std::vector<std::string> getStringList();
};

TS_EXPORT TS_RETURN_TYPE("Array<string>") std::vector<std::string> getStringList();




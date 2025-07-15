#pragma once

#include <TS.h>
#include <std/tsarray.h>
#include <std/tsobject.h>
#include <std/tsstring.h>

#include <string>
#include <vector>

class TS_EXPORT Collection : public Object
{
public:
    TS_METHOD Collection() = default;

    TS_METHOD TS_RETURN_TYPE("Array<string>") Array<String*>* getStringList();
};

TS_EXPORT TS_RETURN_TYPE("Array<string>") Array<String*>* getStringList();

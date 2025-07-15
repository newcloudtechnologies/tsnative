#pragma once

#include <TS.h>

#include "std/tsarray.h"

class String;
class Boolean;

class TS_DECLARE ArgsToArray final : public Object
{
public:
    TS_METHOD ArgsToArray(Array<Object*>* aggregator);

    TS_METHOD void addObject(Object* nextArg, Boolean* isSpread);

private:
    Array<Object*>* m_aggregator;
};

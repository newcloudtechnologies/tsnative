#pragma once

#include <TS.h>

#include "std/private/options.h"

#include "std/tsboolean.h"
#include "std/tsnumber.h"
#include "std/tsobject.h"

class Number;
class String;
class ToStringConverter;

TS_CODE("// @ts-ignore\n"
        "export type TSLazyClosure = Function;\n");

class TS_EXPORT TS_DECLARE TS_IGNORE TSLazyClosure : public Object
{
public:
    using Enviroment = void***;

    TS_METHOD TS_NO_CHECK TSLazyClosure(Enviroment env);
    ~TSLazyClosure() override;

    TS_METHOD TS_NO_CHECK Enviroment getEnvironment();

    TS_METHOD String* toString() const override;

private:
    Enviroment _env = nullptr;

private:
    friend class ToStringConverter;
};

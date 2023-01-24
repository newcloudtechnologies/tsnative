/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
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

#include "std/private/options.h"

#include "std/tsboolean.h"
#include "std/tsnumber.h"
#include "std/tsobject.h"
#include "std/tsunion.h"

#include <ostream>
#include <type_traits>

class Number;
class String;

TS_CODE("// @ts-ignore\n"
        "export type TSClosure = Function;\n");

class TS_EXPORT TS_DECLARE TS_IGNORE TSClosure : public Object
{
public:
    TS_METHOD TS_NO_CHECK TSClosure(void* fn, void*** env, Number* envLength, Number* numArgs, Number* optionals);
    ~TSClosure() override;

    TS_METHOD TS_NO_CHECK void*** getEnvironment() const;

    template <typename T>
    void setEnvironmentElement(T value, int index);

    Number* getNumArgs() const;

    // unsutable, legacy in fact
    TS_METHOD TS_SIGNATURE("call(): void") TS_DECORATOR("MapsTo('operator()()')") void* operator()() const;

    void* call() const;

    TS_METHOD String* toString() const override;

    std::vector<Object*> getChildObjects() const override;
    std::string toStdString() const override;

private:
    void* _fn = nullptr;
    void*** _env = nullptr;
    Number* _envLength = nullptr;
    Number* _numArgs = nullptr;
    int64_t _optionals = 0;
};

template <typename T>
void TSClosure::setEnvironmentElement(T value, int index)
{
    static_assert(std::is_pointer<T>::value, "Expected value to be of pointer type");
    auto** objectStarAddress = _env[index];

    if ((this->_optionals & (1 << index)) != 0)
    {
        Union* optional = static_cast<Union*>(*objectStarAddress);
        optional->setValue(Object::asObjectPtr(value));
        return;
    }

    *objectStarAddress = value;
}

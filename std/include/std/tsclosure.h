#pragma once

#include <TS.h>

#include "std/private/options.h"

#include "std/tsboolean.h"
#include "std/tsnumber.h"
#include "std/tsobject.h"
#include "std/tsunion.h"

#include <cstdint>
#include <functional>
#include <type_traits>

class Number;
class String;
class ToStringConverter;

TS_CODE("// @ts-ignore\n"
        "export type TSClosure = Function;\n");

class TS_EXPORT TS_DECLARE TS_IGNORE TSClosure : public Object
{
public:
    using FunctionToCall = std::function<void*(void***)>;

public:
    TS_METHOD TS_NO_CHECK TSClosure(void* fn, void*** env, Number* envLength, Number* numArgs, Number* optionals);
    TSClosure(FunctionToCall&& fn, void*** env, std::uint32_t envLength, std::uint32_t numArgs);
    ~TSClosure() override;

    TS_METHOD TS_NO_CHECK void*** getEnvironment() const;

    template <typename T>
    void setEnvironmentElement(T value, int index);

    std::uint32_t getNumArgs() const;

    std::uint32_t getEnvironmentLength() const;

    TS_METHOD void* call() const;

    TS_METHOD String* toString() const override;

    std::vector<Object*> getChildObjects() const override;

private:
    FunctionToCall _fn;
    void*** _env = nullptr;
    std::uint32_t _envLength;
    std::uint32_t _numArgs;
    std::uint32_t _optionals = 0;

private:
    friend class ToStringConverter;
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

#pragma once

#include "private/options.h"

#include "std/private/options.h"

#include "std/tsboolean.h"
#include "std/tsnumber.h"
#include "std/tsoptional.h"

#include <TS.h>

TS_CODE("// @ts-ignore\n"
        "export type TSClosure = Function;\n");
        
class TSClosure
{
public:
    TS_METHOD TSClosure(void* fn, void** env, Number* numArgs, Number* optionals);

    TS_METHOD void** getEnvironment() const;

    template <typename T>
    void setEnvironmentElement(T value, int index);

    Number* getNumArgs() const;

    TS_METHOD TS_SIGNATURE("call(): void") TS_DECORATOR("MapsTo('operator()()')") TS_IGNORE void* operator()();

private:
    void* fn = nullptr;
    void** env = nullptr;
    Number* numArgs = nullptr;
    int64_t optionals = 0;
};

template <typename T>
void TSClosure::setEnvironmentElement(T value, int index)
{
    static_assert(std::is_pointer<T>::value, "Expected value to be of pointer type");

    if ((this->optionals & (1 << index)) != 0)
    {
        TSOptional<T>* optional = static_cast<TSOptional<T>*>(env[index]);

        optional->marker = GC::createHeapAllocated<Boolean>(true);
        optional->value = value;

        return;
    }

    env[index] = value;
}

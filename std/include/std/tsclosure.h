#pragma once

#include "tsoptional.h"
#include "tsnumber.h"

class TSClosure
{
public:
    TSClosure(void* fn, void** env, Number* numArgs, Number* optionals);

    void** getEnvironment() const;

    template <typename T>
    void setEnvironmentElement(T* value, int index);

    Number* getNumArgs() const;

    void* operator()();

private:
    void* fn = nullptr;
    void** env = nullptr;
    Number* numArgs = nullptr;
    int64_t optionals = 0;
};

template <typename T>
void TSClosure::setEnvironmentElement(T* value, int index)
{
    if ((this->optionals & (1 << index)) != 0)
    {
        TSOptional<T>* optional = static_cast<TSOptional<T>*>(env[index]);

        *(optional->marker) = 0;
        optional->value = value;

        return;
    }

    env[index] = value;
}

#pragma once

class TSClosure
{
public:
    TSClosure(void* fn, void** env, int numArgs);

    void** getEnvironment() const;

    template <typename T>
    void setEnvironmentElement(T* value, int index);

    int getNumArgs() const;

    void* operator()();

private:
    void* fn = nullptr;
    void** env = nullptr;
    int numArgs = 0;
};

template <typename T>
void TSClosure::setEnvironmentElement(T* value, int index)
{
    env[index] = reinterpret_cast<void*>(value);
}

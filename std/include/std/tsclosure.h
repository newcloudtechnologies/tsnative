#pragma once

#include "std/private/options.h"

#include "std/tsboolean.h"
#include "std/tsnumber.h"
#include "std/tsobject.h"
#include "std/tsunion.h"

#include <ostream>
#include <type_traits>

class Number;
class String;

class TSClosure : public Object
{
public:
    TSClosure(void* fn, void** env, Number* numArgs, Number* optionals);
    // this class is not an owner of passed ptrs, so use default dtor.
    // @todo: should ptrs be untracked here?
    ~TSClosure() override = default;

    void** getEnvironment() const;

    template <typename T>
    void setEnvironmentElement(T value, int index);

    Number* getNumArgs() const;

    // unsutable, legacy in fact
    void* operator()() const;

    void* call() const;

    String* toString() const override;

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
        Union* optional = static_cast<Union*>(env[index]);
        optional->setValue(static_cast<Object*>(value));
        return;
    }

    env[index] = value;
}

inline std::ostream& operator<<(std::ostream& os, const TSClosure* cl)
{
    os << cl->toString();
    return os;
}

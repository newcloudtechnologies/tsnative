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
    TS_METHOD TSClosure(void* fn, void** env, Number* envLength, Number* numArgs, Number* optionals);
    // this class is not an owner of passed ptrs, so use default dtor.
    // @todo: should ptrs be untracked here?
    // TODO Env should be deleted by the destructor
    ~TSClosure() override = default;

    TS_METHOD void** getEnvironment() const;

    template <typename T>
    void setEnvironmentElement(T value, int index);

    Number* getNumArgs() const;

    // unsutable, legacy in fact
    TS_METHOD TS_SIGNATURE("call(): void") TS_DECORATOR("MapsTo('operator()()')") void* operator()() const;

    void* call() const;

    TS_METHOD String* toString() const override;

    std::vector<Object*> getChildren() const override;

private:
    void* fn = nullptr;
    void** env = nullptr;
    Number* envLength = nullptr;
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

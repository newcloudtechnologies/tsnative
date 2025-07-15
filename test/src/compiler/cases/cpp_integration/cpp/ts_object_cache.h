#pragma once

#include <TS.h>

#include <std/tsclosure.h>
#include <std/tsnumber.h>
#include <std/tsobject.h>
#include <std/tsobject_owner.h>

#include <functional>

namespace cpp_integration IS_TS_MODULE
{

class ClickableButton
{
public:
    void onClick(std::function<Number*()> handler)
    {
        m_handler = std::move(handler);
    }

    Number* click()
    {
        return m_handler();
    }

private:
    std::function<Number*()> m_handler;
};

class TS_EXPORT TSObjectCache : public Object
{
public:
    TS_METHOD TSObjectCache();

    TS_METHOD void addNumber(Number* num);
    TS_METHOD void setClosure(TSClosure* closure);
    TS_METHOD void setClassClosure(TSClosure* classClosure);

    TS_METHOD void onClick(TSClosure* tsHandler);
    TS_METHOD Number* click();

    TS_METHOD Number* getNumbersSum() const;

    TS_METHOD void clear();

    TS_METHOD String* getClosureString() const;

    TS_METHOD void callClassClosure();

    TS_METHOD static void setStaticNumber(Number* num);

private:
    std::vector<TSObjectOwner<Number>> m_numbers;
    TSObjectOwner<TSClosure> m_closure;
    TSObjectOwner<TSClosure> m_classClosure;
    static TSObjectOwner<Number> s_staticNumber;

    ClickableButton m_button;
};

} // namespace IS_TS_MODULE
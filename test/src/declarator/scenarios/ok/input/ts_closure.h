#pragma once

#include <TS.h>
#include <std/tsclosure.h>
#include <std/tsobject.h>

#include <functional>

namespace global IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

class TS_EXPORT Widget : public Object
{
public:
    TS_METHOD Widget(Widget* parent);
};

class TS_EXPORT Button : public Object
{
public:
    typedef std::function<void()> ClickedSlot;

public:
    TS_METHOD Button(Widget* parent);

    TS_METHOD void onClicked(TSClosure* closure) const;
};

} // namespace IS_TS_NAMESPACE

} // namespace IS_TS_MODULE

#pragma once

#include <TS.h>

#include <functional>

namespace global IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

class TS_EXPORT Widget
{
public:
    TS_METHOD Widget(Widget& parent);
};

class TS_EXPORT Button
{
public:
    typedef std::function<void ()> ClickedSlot;

public:
    TS_METHOD Button(Widget& parent);

    TS_CLOSURE void onClicked(ClickedSlot slot) const;
};

}   // namespace snippets

}   // namespace global


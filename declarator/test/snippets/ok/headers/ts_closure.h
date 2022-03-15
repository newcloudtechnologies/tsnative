/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
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
    typedef std::function<void()> ClickedSlot;

public:
    TS_METHOD Button(Widget& parent);

    TS_CLOSURE void onClicked(ClickedSlot slot) const;
};

} // namespace IS_TS_NAMESPACE

} // namespace IS_TS_MODULE

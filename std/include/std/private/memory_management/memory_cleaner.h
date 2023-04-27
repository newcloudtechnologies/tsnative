/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <functional>

class IEventLoop;
class IGCImpl;
class IGCValidator;

class MemoryCleaner
{
public:
    MemoryCleaner(IEventLoop& loop, IGCImpl& gc, const IGCValidator* validator);

    void asyncClear(const std::function<void()> afterClear);

    bool isCollectScheduled() const;

private:
    IEventLoop& _eventLoop;
    IGCImpl& _gc;
    const IGCValidator* _gcValidator = nullptr;

    bool _collectScheduled = false;
};
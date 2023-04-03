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

class MemoryCleaner
{
public:
    MemoryCleaner(IEventLoop* loop, IGCImpl* gc);

    void asyncClear(const std::function<void()> afterClear);

private:
    IEventLoop* _eventLoop;
    IGCImpl* _gc;

    bool _collectScheduled = false;
};
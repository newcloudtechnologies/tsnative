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
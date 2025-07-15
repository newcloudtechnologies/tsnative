#pragma once

#include "iexecutor.h"

class IEventLoop;

class DefaultExecutor : public IExecutor
{
public:
    explicit DefaultExecutor(IEventLoop& eventLoop);

    ~DefaultExecutor() override = default;

    void enqueue(IExecutor::Callback&& callback) const noexcept override;

private:
    IEventLoop& _eventLoop;
};

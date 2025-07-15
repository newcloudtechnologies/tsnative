#pragma once

#include <functional>

class IExecutor
{
public:
    using Callback = std::function<void()>;

    virtual ~IExecutor() = default;

    virtual void enqueue(Callback&& callback) const noexcept = 0;
};

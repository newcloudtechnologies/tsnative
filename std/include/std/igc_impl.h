#pragma once

#include <cstddef>

class Object;

class IGCImpl
{
public:
    virtual ~IGCImpl() = default;
    
    virtual std::size_t getAliveObjectsCount() const = 0;

    virtual void onScopeOpened(std::size_t handle) = 0;
    virtual void onScopeClosed(std::size_t handle) = 0;
    
    virtual void collect() = 0;
};

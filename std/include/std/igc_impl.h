#pragma once

#include <cstddef>

class Object;

class IGCImpl
{
public:
    virtual ~IGCImpl() = default;
    
    virtual std::size_t getAliveObjectsCount() const = 0;
    virtual void addRoot(Object* object) = 0;
    virtual void removeRoot(Object* object) = 0;
    virtual void collect() = 0;
};

#pragma once

#include <cstddef>

class Object;

class IGCImpl
{
public:
    virtual ~IGCImpl() = default;
    
    virtual std::size_t getAliveObjectsCount() const = 0;

    // These methods make IGCImpl to be leaky abstraction
    // We can avoid them by notifying gc implementation about adding/removing roots 
    // from the compiler level
    virtual void addRoot(Object* object) = 0;
    virtual void removeRoot(Object* object) = 0;
    
    virtual void collect() = 0;
};

#pragma once

#include <cstdint>
#include <ostream>
#include <sstream>

#include "gc.h"
#include "tsstring.h"

template <typename T>
struct TSOptional
{
    Boolean* marker = nullptr;
    void* value = nullptr;

    template <typename U>
    friend std::ostream& operator<<(std::ostream& os, TSOptional<U>* optional);

private:
    String* toString() const
    {
        if (!this->marker || this->marker->unboxed() == false)
        {
            return GC::createHeapAllocated<String>("undefined");
        }

        return this->toStringImpl();
    }

    template <typename U = T>
    typename std::enable_if<std::is_arithmetic<U>::value, String*>::type toStringImpl() const
    {
        // @todo: never

        std::ostringstream oss;
        oss << *static_cast<U*>(this->value);
        return GC::createHeapAllocated<String>(oss.str());
    }

    template <typename U = T>
    typename std::enable_if<!std::is_arithmetic<U>::value, String*>::type toStringImpl() const
    {
        std::ostringstream oss;
        oss << static_cast<U>(this->value);
        return GC::createHeapAllocated<String>(oss.str());
    }
};

template <typename U>
inline std::ostream& operator<<(std::ostream& os, TSOptional<U>* optional)
{
    os << optional->toString();
    return os;
}

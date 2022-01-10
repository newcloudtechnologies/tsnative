#pragma once

#include <cstdint>
#include <ostream>
#include <sstream>

#include "gc.h"
#include "stdstring.h"

template <typename T>
struct TSOptional
{
    int8_t* marker = nullptr;
    void* value = nullptr;

    template <typename U>
    friend std::ostream& operator<<(std::ostream& os, TSOptional<U>* optional);

private:
    string* toString() const
    {
        if (!this->marker || *(this->marker) == -1)
        {
            return GC::createHeapAllocated<string>("undefined");
        }

        return this->toStringImpl();
    }

    template <typename U = T>
    typename std::enable_if<std::is_arithmetic<U>::value, string*>::type toStringImpl() const
    {
        std::ostringstream oss;
        oss << *static_cast<U*>(this->value);
        return GC::createHeapAllocated<string>(oss.str());
    }

    template <typename U = T>
    typename std::enable_if<!std::is_arithmetic<U>::value, string*>::type toStringImpl() const
    {
        std::ostringstream oss;
        oss << static_cast<U>(this->value);
        return GC::createHeapAllocated<string>(oss.str());
    }
};

template <typename U>
inline std::ostream& operator<<(std::ostream& os, TSOptional<U>* optional)
{
    os << optional->toString();
    return os;
}

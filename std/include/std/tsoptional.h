#pragma once

#include <cstdint>
#include <ostream>
#include <sstream>

#include "gc.h"
#include "tsstring.h"

template <typename T>
struct TSOptional
{
    static_assert(std::is_pointer<T>::value, "Optional value type expected to be a pointer");

    Boolean* marker = nullptr;
    void* value = nullptr;

    bool hasValue() const
    {
        return this->marker && this->marker->unboxed() == true;
    }

    T getValue() const
    {
        return static_cast<T>(value);
    }

    template <typename U>
    friend std::ostream& operator<<(std::ostream& os, TSOptional<U>* optional);

private:
    String* toString() const
    {
        if (!hasValue())
        {
            return GC::createHeapAllocated<String>("undefined");
        }

        return this->toStringImpl();
    }

    String* toStringImpl() const
    {
        std::ostringstream oss;
        oss << static_cast<T>(this->value);
        return GC::createHeapAllocated<String>(oss.str());
    }
};

template <typename U>
inline std::ostream& operator<<(std::ostream& os, TSOptional<U>* optional)
{
    os << optional->toString();
    return os;
}

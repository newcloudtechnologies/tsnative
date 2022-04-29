#pragma once

#include "std/tsobject.h"
#include "std/tsstring.h"
#include "std/tsunion.h"

#include <ostream>
#include <string>

// mkrv @todo
// some kind of storage is needed for this stuff
static auto parentString = new String("parent");
static auto recursiveString = new String("<recursive>");

inline std::ostream& operator<<(std::ostream& os, const Object* o)
{
    const auto& keys = o->_props->orderedKeys();

    static size_t depth = 0;
    static const int8_t PADDING_WIDTH = 2;

    os << size_t(o) << ": {\n";

    ++depth;

    for (const auto& key : keys)
    {
        os << std::string(depth * PADDING_WIDTH, ' ') << key << ":";

        bool isParent = key->equals(parentString)->unboxed();
        auto maybe = static_cast<const Union*>(o->_props->get(key));
        auto obj = maybe->getValue();

        if (isParent)
        {
            os << "<recursive: " << size_t(obj) << ">";
        }
        else
        {
            os << obj->toString();
        }

        os << "\n";
    }

    depth--;
    os << std::string(depth * PADDING_WIDTH, ' ') + "}";

    return os;
}

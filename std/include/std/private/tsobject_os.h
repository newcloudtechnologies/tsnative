#include "std/tsobject.h"
#include "std/tsstring.h"

#include <ostream>
#include <string>

inline std::ostream& operator<<(std::ostream& os, const Object* o)
{
    const auto& keys = o->_props->orderedKeys();

    static size_t depth = 0;
    static const int8_t PADDING_WIDTH = 2;

    os << "{\n";

    ++depth;

    for (const auto& key : keys)
    {
        os << std::string(depth * PADDING_WIDTH, ' ') << key << ": "
           << static_cast<const Object*>(o->_props->get(key))->toString() << "\n";
    }

    depth--;
    os << std::string(depth * PADDING_WIDTH, ' ') + "}";

    return os;
}
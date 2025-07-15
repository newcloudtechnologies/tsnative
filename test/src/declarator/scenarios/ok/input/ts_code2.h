#pragma once

#include <TS.h>
#include <std/tsobject.h>

namespace global IS_TS_MODULE
{

class TS_EXPORT Entity : public Object
{
public:
    Entity() = default;
    ~Entity() = default;
    TS_METHOD void entity();

    TS_CODE("toString(): string;\n"
            "toNumber(): number;\n\n");

    TS_CODE("// @ts-ignore\n"
            "@MapsTo(\"operator==\")\n"
            "private equals(string): boolean;\n");
};

TS_CODE("// @ts-ignore\n"
        "declare type string = String;\n");

} // namespace IS_TS_MODULE

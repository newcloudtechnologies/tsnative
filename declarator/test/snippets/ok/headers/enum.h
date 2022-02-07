#pragma once

#include <TS.h>

namespace test IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

class TS_EXPORT Object
{
public:
    enum TS_EXPORT Types
    {
        PLANT,
        ANIMAL,
        INSECT
    };

public:
    TS_METHOD Object() = default;
    ~Object() = default;

    TS_METHOD Types getType();
};

}   //  namespace snippets
}   // namespace test


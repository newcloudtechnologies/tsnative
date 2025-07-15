#pragma once

#include <cstddef>

using ID = std::size_t;

class IDGenerator final
{
public:
    ID createID();

private:
    static ID currentID;
};
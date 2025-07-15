#pragma once

#include "std/private/emitter.h"

struct MouseEvent
{
    MouseEvent(int x, int y)
        : x{x}
        , y{y}
    {
    }
    int x{0};
    int y{0};
};

struct ErrorEvent
{
};

struct MockEmitter : public EmitterBase<MockEmitter, ErrorEvent, MouseEvent>
{
};

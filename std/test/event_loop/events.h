/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

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

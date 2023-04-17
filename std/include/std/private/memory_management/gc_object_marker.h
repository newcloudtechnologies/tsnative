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

#include "std/private/memory_management/async_object_storage.h"
#include "std/private/memory_management/gc_types.h"

class GCObjectMarker
{
public:
    GCObjectMarker(const Roots& roots, TimerStorage& timers);
    ~GCObjectMarker();

    void mark();

    void unmark();

    const UniqueConstObjects& getMarked() const;

    bool isMarked(const Object* obj) const;

private:
    UniqueConstObjects _marked;
    const Roots& _roots;
    TimerStorage& _timers; // TODO remove -  https://jira.ncloudtech.ru:8090/browse/TSN-551
};
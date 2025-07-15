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
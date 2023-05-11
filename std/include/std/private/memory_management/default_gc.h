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

#include "std/private/memory_management/igc_impl.h"

#include "std/private/memory_management/async_object_storage.h"
#include "std/private/memory_management/gc_names_storage.h"
#include "std/private/memory_management/gc_object_marker.h"
#include "std/private/memory_management/gc_types.h"

#include <functional>
#include <unordered_set>

class Object;
class GCObjectMarker;

class DefaultGC : public IGCImpl
{
public:
    struct Callbacks final
    {
        std::function<void(void*)> deleteObject = [](void*) {};
    };

    DefaultGC(TimerStorage& timers, Callbacks&& gcCallbacks);
    ~DefaultGC();

    void addObject(Object* o) override;

    std::size_t getAliveObjectsCount() const override;

    void addRoot(Object** object, const Object* associatedName) override;
    void addRootWithName(Object** object, const char* name) override;
    void removeRoot(Object** object) override;

    void collect() override;
    void print(const std::string& fileName = "") const override;

    const UniqueObjects& getHeap() const;
    const Roots& getRoots() const;
    const UniqueConstObjects& getMarked() const;

private:
    void sweep();
    void insertRoot(Object** root);

private:
    UniqueObjects _heap;
    Roots _roots;
    GCNamesStorage _names;
    GCObjectMarker _marker;
    Callbacks _callbacks;
};

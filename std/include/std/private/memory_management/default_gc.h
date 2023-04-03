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

#include "std/private/algorithms.h"
#include "std/private/memory_management/async_object_storage.h"
#include "std/private/memory_management/gc_names_storage.h"

#include <unordered_set>

class Object;

class DefaultGC : public IGCImpl
{
public:
    struct Callbacks final
    {
        std::function<void(void*)> afterDelete = [](void*) {};
    };

    DefaultGC(TimerStorage& timers, Callbacks&& gcCallbacks);
    ~DefaultGC();

    void addObject(Object* o) override;

    std::size_t getAliveObjectsCount() const override;

    void addRoot(Object** object, const Object* associatedName) override;
    void addRootWithName(Object** object, const char* name) override;
    void removeRoot(Object** object) override;

    void collect() override;
    void print() const override;

private:
    void mark();
    void sweep();
    void unmarkRoots();
    void insertRoot(Object** root);

    template <typename Element, typename Condition>
    void markStorage(AsyncObjectStorage<Element>& storage, const Condition& isReady)
    {
        for (auto it = storage.begin(); it != storage.end();)
        {
            auto& object = it->second.get();
            if (isReady(object))
            {
                it = storage.erase(it);
                continue;
            }

            object.mark();
            ++it;
        }
    }

private:
    // TODO Use absl::uset
    std::unordered_set<Object*> _heap;
    std::unordered_set<Object**> _roots;
    GCNamesStorage _names;
    Callbacks _callbacks;
    TimerStorage& _timers; // TODO remove -  https://jira.ncloudtech.ru:8090/browse/TSN-551
};

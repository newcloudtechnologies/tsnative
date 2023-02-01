/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <TS.h>

#include "std/igc_impl.h"

#include <functional>
#include <mutex>
#include <unordered_set>
#include <vector>

class Object;
class IMemoryDiagnosticsImpl;

class DefaultGC : public IGCImpl
{
public:
    struct Callbacks final
    {
        std::function<void(const Object&)> beforeDeleted = [](const Object&) {};
        std::function<void(const void*)> afterDeleted = [](const void*) {};
    };

    DefaultGC(Callbacks&& callbacks);
    ~DefaultGC();

    void addObject(Object* o);

    std::size_t getAliveObjectsCount() const override;

    void addRoot(Object** object, const String* associatedName) override;
    void removeRoot(Object** object) override;

    void collect() override;
    void print() const override;

private:
    void mark();
    void sweep();

private:
    std::mutex _rootsMutex;
    std::mutex _heapMutex;

    // TODO Use absl::uset
    std::unordered_set<Object*> _heap;
    std::unordered_set<Object**> _roots;
    Callbacks _callbacks;
};

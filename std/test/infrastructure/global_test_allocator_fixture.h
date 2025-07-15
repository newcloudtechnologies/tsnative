#pragma once

#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "../infrastructure/test_allocator.h"

#include <memory>
#include <vector>

#include "std/tsobject.h"

namespace test
{

// TODO Shit code, static non const state
// We need better allocator concept for the project
class GlobalTestAllocatorFixture : public ::testing::Test
{
public:
    static TestAllocator& getAllocator();

    void SetUp() override
    {
        TestAllocator::Callbacks allocatorCallbacks;
        allocatorCallbacks.onAllocated = [this](void* o)
        {
            auto* obj = static_cast<::Object*>(o);
            _actualAllocatedObjects.push_back(obj);
        };
        _allocator = std::make_unique<TestAllocator>(std::move(allocatorCallbacks));
    }

    void TearDown() override
    {
        _allocator = nullptr;

        // delete objects in reversed creation order
        for (auto rit = _actualAllocatedObjects.rbegin(); rit != _actualAllocatedObjects.rend(); ++rit)
        {
            auto* o = *rit;
            delete o;
        }
    }

    const std::vector<Object*>& getActualAllocatedObjects() const
    {
        return _actualAllocatedObjects;
    }

private:
    std::vector<Object*> _actualAllocatedObjects;

protected:
    static std::unique_ptr<TestAllocator> _allocator;
};

} // namespace test
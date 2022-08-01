#pragma once

#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include "../infrastructure/test_allocator.h"

#include <memory>

namespace test
{

// TODO Shit code, static non const state
// We need better allocator concept for the project
class GlobalTestAllocatorFixture : public ::testing::Test
{
public:
    static TestAllocator& getAllocator();

protected:
    static std::unique_ptr<TestAllocator> _allocator;
};

} // test
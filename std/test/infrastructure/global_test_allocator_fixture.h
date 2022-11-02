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

#include <gmock/gmock.h>
#include <gtest/gtest.h>

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

} // namespace test
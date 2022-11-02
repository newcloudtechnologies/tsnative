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

#include "global_test_allocator_fixture.h"

namespace test
{

std::unique_ptr<TestAllocator> GlobalTestAllocatorFixture::_allocator = nullptr;

TestAllocator& GlobalTestAllocatorFixture::getAllocator()
{
    return *_allocator;
}

} // namespace test
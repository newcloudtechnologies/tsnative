#include "global_test_allocator_fixture.h"

namespace test
{

std::unique_ptr<TestAllocator> GlobalTestAllocatorFixture::_allocator = nullptr;

TestAllocator& GlobalTestAllocatorFixture::getAllocator()
{
    return *_allocator;
}

} // test
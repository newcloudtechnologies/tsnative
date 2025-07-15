#include "test_allocator.h"

TestAllocator::TestAllocator(Callbacks&& callbacks)
    : _callbacks{std::move(callbacks)}
{
}
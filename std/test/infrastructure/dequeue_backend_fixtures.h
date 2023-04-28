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

#include "../infrastructure/object_factory.h"
#include "../infrastructure/object_wrappers.h"
#include "std/private/tsarray_std_p.h"

#include <gtest/gtest.h>
#include <vector>

class DequeueBackendFixture : public test::GlobalTestAllocatorFixture
{
public:
    DequeueBackend<Number*> getEmptyArray() const
    {
        DequeueBackend<Number*> backend;
        return backend;
    }

    DequeueBackend<Number*> getFilledBackend() const
    {
        DequeueBackend<Number*> backend;
        backend.push(new test::Number(10));
        backend.push(new test::Number(20));
        backend.push(new test::Number(30));
        return backend;
    }

    template <typename R, template <typename> class A, typename T>
    std::vector<R> toVector(const A<T*>& backend) const
    {
        std::vector<R> result;

        for (const auto& it : backend.toStdVector())
        {
            auto element = it->unboxed();
            result.push_back(static_cast<R>(element));
        }

        return result;
    }
};

struct TestParamWithTwoArgs final
{
    std::vector<int> inputArray;
    std::vector<int> expectedLeft;
    std::vector<int> expectedRemoved;

    int start = 0;
    int deleteCount = 0;
};

class DequeBackendSpliceWithTwoArgsTestFixture : public ::testing::TestWithParam<TestParamWithTwoArgs>
{
};
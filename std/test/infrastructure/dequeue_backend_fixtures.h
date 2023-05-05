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
#include <string>
#include <vector>

class DequeueBackendFixture : public test::GlobalTestAllocatorFixture
{
public:
    DequeueBackend<Number*> getEmptyBackend() const
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

    DequeueBackend<Number*> getUnorderedBackend() const
    {
        DequeueBackend<Number*> backend;
        backend.push(new test::Number(44));
        backend.push(new test::Number(16));
        backend.push(new test::Number(32));
        backend.push(new test::Number(78));
        backend.push(new test::Number(1));
        backend.push(new test::Number(36));
        backend.push(new test::Number(8));
        backend.push(new test::Number(17));
        backend.push(new test::Number(6));
        backend.push(new test::Number(12));
        return backend;
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

template <typename R, template <typename> class A>
struct Serializer
{
    template <typename T>
    static std::vector<R> toVector(const A<T*>& backend)
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

template <template <typename> class A>
struct Serializer<std::string, A>
{
    template <typename T>
    static std::vector<std::string> toVector(const A<T*>& backend)
    {
        std::vector<std::string> result;

        for (const auto& it : backend.toStdVector())
        {
            result.push_back(it->cpp_str());
        }

        return result;
    }
};

using IntDequeueBackend = Serializer<int, DequeueBackend>;
using StringDequeueBackend = Serializer<std::string, DequeueBackend>;
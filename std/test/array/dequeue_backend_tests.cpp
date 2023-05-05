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

#include <gtest/gtest.h>

#include "../infrastructure/dequeue_backend_fixtures.h"

namespace
{

TEST_F(DequeueBackendFixture, push)
{
    auto backend = getEmptyBackend();

    backend.push(new test::Number(10));
    backend.push(new test::Number(20));
    backend.push(new test::Number(30));

    EXPECT_EQ(backend.empty(), false);
    EXPECT_EQ(backend.length(), 3);

    auto left = IntDequeueBackend::toVector(backend);

    EXPECT_THAT(left, ::testing::ElementsAreArray({10, 20, 30}));
}

TEST_F(DequeueBackendFixture, pop)
{
    auto backend = getFilledBackend();

    EXPECT_EQ(backend.length(), 3);

    auto left1 = IntDequeueBackend::toVector(backend);
    EXPECT_THAT(left1, ::testing::ElementsAreArray({10, 20, 30}));

    auto* poped_value = backend.pop();
    EXPECT_FLOAT_EQ(poped_value->unboxed(), 30.);

    EXPECT_EQ(backend.length(), 2);

    auto left2 = IntDequeueBackend::toVector(backend);
    EXPECT_THAT(left2, ::testing::ElementsAreArray({10, 20}));

    backend.push(new test::Number(40));
    backend.push(new test::Number(50));

    EXPECT_EQ(backend.length(), 4);

    auto left3 = IntDequeueBackend::toVector(backend);
    EXPECT_THAT(left3, ::testing::ElementsAreArray({10, 20, 40, 50}));

    poped_value = backend.pop();
    EXPECT_FLOAT_EQ(poped_value->unboxed(), 50.);

    poped_value = backend.pop();
    EXPECT_FLOAT_EQ(poped_value->unboxed(), 40.);

    poped_value = backend.pop();
    EXPECT_FLOAT_EQ(poped_value->unboxed(), 20.);

    poped_value = backend.pop();
    EXPECT_FLOAT_EQ(poped_value->unboxed(), 10.);

    EXPECT_EQ(backend.length(), 0);
}

TEST_F(DequeueBackendFixture, popWhenEmpty)
{
    auto backend = getEmptyBackend();

    EXPECT_THROW(
        {
            try
            {
                backend.pop();
            }
            catch (std::exception& e)
            {
                EXPECT_STREQ("can't pop element, array is empty", e.what());
                throw;
            }
        },
        std::exception);
}

TEST_F(DequeueBackendFixture, empty)
{
    auto backend = getEmptyBackend();

    EXPECT_EQ(backend.empty(), true);

    backend.push(new test::Number(10));

    EXPECT_EQ(backend.empty(), false);

    backend.pop();

    EXPECT_EQ(backend.empty(), true);
}

TEST_F(DequeueBackendFixture, sort)
{
    auto backend = getUnorderedBackend();

    auto left1 = IntDequeueBackend::toVector(backend);

    EXPECT_THAT(left1, ::testing::ElementsAreArray({44, 16, 32, 78, 1, 36, 8, 17, 6, 12}));

    backend.sort([](const auto& a, const auto& b) { return a->unboxed() < b->unboxed(); });

    auto left2 = IntDequeueBackend::toVector(backend);

    EXPECT_THAT(left2, ::testing::ElementsAreArray({1, 6, 8, 12, 16, 17, 32, 36, 44, 78}));
}

// TODO: add other tests for DequeueBackend

} // namespace

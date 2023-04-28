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

#include "../infrastructure/dequeue_backend_fixtures.h"

#include <gtest/gtest.h>

namespace
{
// clang-format off
TestParamWithTwoArgs twoArgsTests[] =
{   
    // 0. start < -array.length and deleteCount < -array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        -10, // start
        -10 // deleteCount
    },

    // 1. start < -array.length and deleteCount == -array.length + 1
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        -10, // start
        -4 + 1 // deleteCount
    },

    // 2. start < -array.length and -array.length < deleteCount < 0
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        -10, // start
        -2 // deleteCount
    },

    // 3. start < -array.length and deleteCount == -0
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        -10, // start
        -0 // deleteCount
    },

    // 4. start < -array.length and deleteCount == +0
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        -10, // start
        +0 // deleteCount
    },

    // 5. start < -array.length and 0 < deleteCount < array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {2, 3, 4}, // expected left elements
        {1}, // expected removed elements
        -10, // start
        1 // deleteCount
    },

    // 6. start < -array.length and deleteCount = array.length - 1
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {4}, // expected left elements
        {1, 2, 3}, // expected removed elements
        -10, // start
        4 - 1 // deleteCount
    },

    // 7. start < -array.length and deleteCount > array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {}, // expected left elements
        {1, 2, 3, 4}, // expected removed elements
        -10, // start
        50 // deleteCount
    },

    // 8. -array.length < start < 0 and deleteCount < -array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        -2, // start
        -10 // deleteCount
    },

    // 9. -array.length < start < 0 and deleteCount == -array.length + 1
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        -2, // start
        -4 + 1 // deleteCount
    },

    // 10. -array.length < start < 0 and -array.length < deleteCount < 0
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        -2, // start
        -2 // deleteCount
    },

    // 11. -array.length < start < 0 and deleteCount == -0
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        -2, // start
        -0 // deleteCount
    },

    // 12. -array.length < start < 0 and deleteCount == +0
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        -2, // start
        +0 // deleteCount
    },

    // 13. -array.length < start < 0 and 0 < deleteCount < array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 4}, // expected left elements
        {3}, // expected removed elements
        -2, // start
        1 // deleteCount
    },

    // 14. -array.length < start < 0 and deleteCount = array.length - 1
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2}, // expected left elements
        {3, 4}, // expected removed elements
        -2, // start
        4 - 1 // deleteCount
    },

    // 15. -array.length < start < 0 and deleteCount > array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2}, // expected left elements
        {3, 4}, // expected removed elements
        -2, // start
        50 // deleteCount
    },

    // 16. start = 0 and deleteCount < -array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        0, // start
        -10 // deleteCount
    },

    // 17. start = 0 and deleteCount == -array.length + 1
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        0, // start
        -4 + 1 // deleteCount
    },

    // 18. start = 0 and -array.length < deleteCount < 0
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        0, // start
        -2 // deleteCount
    },

    // 19. start = 0 and deleteCount == -0
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        0, // start
        -0 // deleteCount
    },

    // 20. start = 0 and deleteCount == +0
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        0, // start
        +0 // deleteCount
    },

    // 21. start = 0and 0 < deleteCount < array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {2, 3, 4}, // expected left elements
        {1}, // expected removed elements
        0, // start
        1 // deleteCount
    },

    // 22. start = 0 and deleteCount = array.length - 1
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {4}, // expected left elements
        {1, 2, 3}, // expected removed elements
        0, // start
        4 - 1 // deleteCount
    },

    // 23. start = 0 and deleteCount > array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {}, // expected left elements
        {1, 2, 3, 4}, // expected removed elements
        0, // start
        50 // deleteCount
    },

    // 24. 0 < start < array.length and deleteCount < -array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        2, // start
        -10 // deleteCount
    },

    // 25. 0 < start < array.length and deleteCount == -array.length + 1
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        2, // start
        -4 + 1 // deleteCount
    },

    // 26. 0 < start < array.length and -array.length < deleteCount < 0
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        2, // start
        -2 // deleteCount
    },

    // 27. 0 < start < array.length and deleteCount == -0
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        2, // start
        -0 // deleteCount
    },

    // 28. 0 < start < array.length and deleteCount == +0
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        2, // start
        +0 // deleteCount
    },

    // 29. 0 < start < array.length and 0 < deleteCount < array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 4}, // expected left elements
        {3}, // expected removed elements
        2, // start
        1 // deleteCount
    },

    // 30. 0 < start < array.length and deleteCount = array.length - 1
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1}, // expected left elements
        {2, 3, 4}, // expected removed elements
        1, // start
        4 - 1 // deleteCount
    },

    // 31. 0 < start < array.length and deleteCount > array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2}, // expected left elements
        {3, 4}, // expected removed elements
        2, // start
        50 // deleteCount
    },

    // 32. start > array.length and deleteCount < -array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        6, // start
        -10 // deleteCount
    },

    // 33. start > array.length and deleteCount == -array.length + 1
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        6, // start
        -4 + 1 // deleteCount
    },

    // 34. start > array.length and -array.length < deleteCount < 0
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        2, // start
        -2 // deleteCount
    },

    // 35. start > array.length and deleteCount == -0
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        6, // start
        -0 // deleteCount
    },

    // 36. start > array.length and deleteCount == +0
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        6, // start
        +0 // deleteCount
    },

    // 37. start > array.length and 0 < deleteCount < array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        6, // start
        1 // deleteCount
    },

    // 38. start > array.length and deleteCount = array.length - 1
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        6, // start
        4 - 1 // deleteCount
    },

    // 39. start > array.length and deleteCount > array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2}, // expected left elements
        {3, 4}, // expected removed elements
        2, // start
        50 // deleteCount
    },

    // 40. start == array.length and 0 < deleteCount < array.length
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        4, // start
        2 // deleteCount
    },

    // 41. start == -inf and deleteCount == -inf
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        std::numeric_limits<int>::min(), // start
        std::numeric_limits<int>::min(), // deleteCount
    },

    // 42. start == -inf and deleteCount == +inf
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {}, // expected left elements
        {1, 2, 3, 4}, // expected removed elements
        std::numeric_limits<int>::min(), // start
        std::numeric_limits<int>::max(), // deleteCount
    },

    // 43. start == +inf and deleteCount == -inf
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        std::numeric_limits<int>::max(), // start
        std::numeric_limits<int>::min(), // deleteCount
    },

    // 44. start == +inf and deleteCount == +inf
    TestParamWithTwoArgs 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        std::numeric_limits<int>::max(), // start
        std::numeric_limits<int>::max(), // deleteCount
    },
};
// clang-format on

TEST_P(DequeBackendSpliceWithTwoArgsTestFixture, spliceWithTwoArguments)
{
    auto inputArray = test::ObjectFactory::createDequeBackend(GetParam().inputArray);
    const auto start = GetParam().start;
    const auto deleteCount = GetParam().deleteCount;

    const auto actual = inputArray.splice(start, deleteCount);
    const auto left = inputArray.toStdVector();

    EXPECT_THAT(actual, ::testing::ElementsAreArray(GetParam().expectedRemoved));
    EXPECT_THAT(left, ::testing::ElementsAreArray(GetParam().expectedLeft));
}

struct TestParamWithOneArg final
{
    std::vector<int> inputArray;
    std::vector<int> expectedLeft;
    std::vector<int> expectedRemoved;

    int start = 0;
};

class DequeBackendSpliceWithOneArgTestFixture : public ::testing::TestWithParam<TestParamWithOneArg>
{
};

// clang-format off
TestParamWithOneArg oneArgTests[] =
{   
    // 0. start < -array.length
    TestParamWithOneArg 
    {
        {1, 2, 3, 4}, // input array
        {}, // expected left elements
        {1, 2, 3, 4}, // expected removed elements
        -10, // start
    },
    // 1. -array.length < start < 0
    TestParamWithOneArg 
    {
        {1, 2, 3, 4}, // input array
        {1, 2}, // expected left elements
        {3, 4}, // expected removed elements
        -2, // start
    },

    // 2. start = 0
    TestParamWithOneArg 
    {
        {1, 2, 3, 4}, // input array
        {}, // expected left elements
        {1, 2, 3, 4}, // expected removed elements
        0, // start
    },

    // 3. 0 < start < array.length
    TestParamWithOneArg 
    {
        {1, 2, 3, 4}, // input array
        {1, 2}, // expected left elements
        {3, 4}, // expected removed elements
        2, // start
    },

    // 4. start > array.length
    TestParamWithOneArg 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        6, // start
    },

    // 5. start == -inf
    TestParamWithOneArg 
    {
        {1, 2, 3, 4}, // input array
        {}, // expected left elements
        {1, 2, 3, 4}, // expected removed elements
        std::numeric_limits<int>::min(), // start
    },

    // 6. start == +inf
    TestParamWithOneArg 
    {
        {1, 2, 3, 4}, // input array
        {1, 2, 3, 4}, // expected left elements
        {}, // expected removed elements
        std::numeric_limits<int>::max(), // start
    },
};
// clang-format on

TEST_P(DequeBackendSpliceWithOneArgTestFixture, spliceWithOneArguments)
{
    auto inputArray = test::ObjectFactory::createDequeBackend(GetParam().inputArray);
    const auto start = GetParam().start;

    const auto actual = inputArray.splice(start);
    const auto left = inputArray.toStdVector();

    EXPECT_THAT(actual, ::testing::ElementsAreArray(GetParam().expectedRemoved));
    EXPECT_THAT(left, ::testing::ElementsAreArray(GetParam().expectedLeft));
}

INSTANTIATE_TEST_CASE_P(ArraySpliceTests, DequeBackendSpliceWithTwoArgsTestFixture, ::testing::ValuesIn(twoArgsTests));
INSTANTIATE_TEST_CASE_P(ArraySpliceTests, DequeBackendSpliceWithOneArgTestFixture, ::testing::ValuesIn(oneArgTests));
} // namespace

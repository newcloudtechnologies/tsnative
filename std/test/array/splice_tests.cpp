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

#include "../infrastructure/array_fixture.h"

#include <gtest/gtest.h>

namespace
{

TEST_F(ArrayFixture, spliceWithBooleanFalse)
{
    auto array = new test::Array<test::Number*>();
    array->push(new test::Number(1));
    array->push(new test::Number(2));
    array->push(new test::Number(3));

    auto start = new test::Number(1);
    auto deleteCount = new test::Union(new test::Boolean(false));

    const auto* result = array->splice(start, deleteCount);

    const auto removed = Serializer<int, ::Array>::toVector(result);
    const auto left = IntArray::toVector(array);

    const std::vector<int> expectedLeft{1, 2, 3};
    const std::vector<int> expectedRemoved{};

    EXPECT_THAT(removed, ::testing::ElementsAreArray(expectedRemoved));
    EXPECT_THAT(left, ::testing::ElementsAreArray(expectedLeft));
}

TEST_F(ArrayFixture, spliceWithBooleanTrue)
{
    auto array = new test::Array<test::Number*>();
    array->push(new test::Number(1));
    array->push(new test::Number(2));
    array->push(new test::Number(3));

    auto start = new test::Number(1);
    auto deleteCount = new test::Union(new test::Boolean(true));

    const auto result = array->splice(start, deleteCount);

    const auto removed = Serializer<int, ::Array>::toVector(result);
    const auto left = IntArray::toVector(array);

    const std::vector<int> expectedLeft{1, 3};
    const std::vector<int> expectedRemoved{2};

    EXPECT_THAT(removed, ::testing::ElementsAreArray(expectedRemoved));
    EXPECT_THAT(left, ::testing::ElementsAreArray(expectedLeft));
}

TEST_F(ArrayFixture, spliceWithDeleteCountUndefined)
{
    auto array = new test::Array<test::Number*>();
    array->push(new test::Number(1));
    array->push(new test::Number(2));
    array->push(new test::Number(3));

    auto start = new test::Number(1);
    auto deleteCount = new test::Union(Undefined::instance());

    const auto result = array->splice(start, deleteCount);

    const auto removed = Serializer<int, ::Array>::toVector(result);
    const auto left = IntArray::toVector(array);

    const std::vector<int> expectedLeft{1};
    const std::vector<int> expectedRemoved{2, 3};

    EXPECT_THAT(removed, ::testing::ElementsAreArray(expectedRemoved));
    EXPECT_THAT(left, ::testing::ElementsAreArray(expectedLeft));
}

TEST_F(ArrayFixture, spliceWithDeleteCountNull)
{
    auto array = new test::Array<test::Number*>();
    array->push(new test::Number(1));
    array->push(new test::Number(2));
    array->push(new test::Number(3));

    auto start = new test::Number(1);
    auto deleteCount = new test::Union(Null::instance());

    const auto result = array->splice(start, deleteCount);

    const auto removed = Serializer<int, ::Array>::toVector(result);
    const auto left = IntArray::toVector(array);

    const std::vector<int> expectedLeft{1, 2, 3};
    const std::vector<int> expectedRemoved{};

    EXPECT_THAT(removed, ::testing::ElementsAreArray(expectedRemoved));
    EXPECT_THAT(left, ::testing::ElementsAreArray(expectedLeft));
}

TEST_F(ArrayFixture, spliceWithDeleteCountString)
{
    auto array = new test::Array<test::Number*>();
    array->push(new test::Number(1));
    array->push(new test::Number(2));
    array->push(new test::Number(3));

    auto start = new test::Number(1);
    auto deleteCount = new test::Union(new test::String("abacaba"));

    const auto result = array->splice(start, deleteCount);

    const auto removed = Serializer<int, ::Array>::toVector(result);
    const auto left = IntArray::toVector(array);

    const std::vector<int> expectedLeft{1, 2, 3};
    const std::vector<int> expectedRemoved{};

    EXPECT_THAT(removed, ::testing::ElementsAreArray(expectedRemoved));
    EXPECT_THAT(left, ::testing::ElementsAreArray(expectedLeft));
}

} // namespace

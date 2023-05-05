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
#include <string>

namespace
{

TEST_F(ArrayFixture, push)
{
    auto numbers = getEmptyNumberArray();

    numbers->push(new test::Number(10));
    numbers->push(new test::Number(20));
    numbers->push(new test::Number(30));
    numbers->push(new test::Number(40));

    const auto left = IntArray::toVector(numbers);

    EXPECT_THAT(left, ::testing::ElementsAreArray({10, 20, 30, 40}));
}

TEST_F(ArrayFixture, pop)
{
    auto numbers = getFilledNumberArray();

    const auto left1 = IntArray::toVector(numbers);
    EXPECT_THAT(left1, ::testing::ElementsAreArray({10, 20, 30, 40}));

    auto* popedValue = numbers->pop();
    EXPECT_FLOAT_EQ(popedValue->getValue<test::Number*>()->unboxed(), 40.);

    numbers->push(new test::Number(50));

    const auto left2 = IntArray::toVector(numbers);
    EXPECT_THAT(left2, ::testing::ElementsAreArray({10, 20, 30, 50}));

    popedValue = numbers->pop();
    EXPECT_FLOAT_EQ(popedValue->getValue<test::Number*>()->unboxed(), 50.);

    popedValue = numbers->pop();
    EXPECT_FLOAT_EQ(popedValue->getValue<test::Number*>()->unboxed(), 30.);

    popedValue = numbers->pop();
    EXPECT_FLOAT_EQ(popedValue->getValue<test::Number*>()->unboxed(), 20.);

    popedValue = numbers->pop();
    EXPECT_FLOAT_EQ(popedValue->getValue<test::Number*>()->unboxed(), 10.);

    EXPECT_FLOAT_EQ(numbers->length()->unboxed(), 0.);
}

TEST_F(ArrayFixture, pop_empty)
{
    auto numbers = new test::Array<test::Number*>();

    auto* popedValue = numbers->pop();
    EXPECT_FALSE(static_cast<Union*>(popedValue)->hasValue());
}

} // namespace

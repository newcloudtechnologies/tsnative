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

#include "../infrastructure/object_wrappers.h"

#include "std/make_closure_from_lambda.h"

class MakeClosureTest : public test::GlobalTestAllocatorFixture
{
};

TEST_F(MakeClosureTest, emptyArgs)
{
    auto closure = makeClosure<test::Closure>([]() { return nullptr; });

    EXPECT_EQ(closure->getNumArgs(), 0);
}

TEST_F(MakeClosureTest, noEmptyArgs)
{
    auto closure1 = makeClosure<test::Closure>([](test::Number** n) { return n; });
    auto closure2 = makeClosure<test::Closure>([](test::Number** n1, test::Number** n2) { return n1; });
    auto closure3 =
        makeClosure<test::Closure>([](test::Number** n1, test::Number** n2, test::Number** n3) { return n1; });

    EXPECT_EQ(closure1->getNumArgs(), 1);
    EXPECT_EQ(closure2->getNumArgs(), 2);
    EXPECT_EQ(closure3->getNumArgs(), 3);
}

TEST_F(MakeClosureTest, checkCall)
{
    auto closure = makeClosure<test::Closure>(
        [](test::Number** n)
        {
            EXPECT_EQ((*n)->unboxed(), 23);
            return n;
        });

    closure->setEnvironmentElement(new test::Number{23.f}, 0);
    closure->call();

    EXPECT_EQ(closure->getNumArgs(), 1);
}

TEST_F(MakeClosureTest, getResult)
{
    auto closure = makeClosure<test::Closure>(
        [](test::Number** n)
        {
            EXPECT_EQ((*n)->unboxed(), 23);
            return *n;
        });

    closure->setEnvironmentElement(new test::Number{23.f}, 0);

    auto result = closure->call();
    auto obj = Object::asObjectPtr(result);

    EXPECT_TRUE(obj->isNumberCpp());

    EXPECT_EQ(static_cast<test::Number*>(obj)->unboxed(), 23);
}

TEST_F(MakeClosureTest, checkCapture)
{
    bool flag{false};
    auto closure = makeClosure<test::Closure>(
        [&]()
        {
            EXPECT_FALSE(flag);
            flag = true;
            return nullptr;
        });
    closure->call();

    EXPECT_TRUE(flag);
}

TEST_F(MakeClosureTest, argIsClosure)
{
    auto closure = makeClosure<test::Closure>(
        [](test::Closure** cl, test::Number** arg)
        {
            EXPECT_EQ((*cl)->getNumArgs(), 1);
            (*cl)->setEnvironmentElement(*arg, 0);
            return (*cl)->call();
        });

    auto f = makeClosure<test::Closure>([](test::Number** n) { return *n; });
    closure->setEnvironmentElement(f, 0);
    closure->setEnvironmentElement(new test::Number{23.f}, 1);

    auto result = closure->call();

    EXPECT_EQ(static_cast<test::Number*>(result)->unboxed(), 23);
    EXPECT_EQ(closure->getNumArgs(), 2);
}
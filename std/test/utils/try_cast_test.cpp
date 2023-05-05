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

#include "std/utils/try_cast.h"

class TryCastTest : public test::GlobalTestAllocatorFixture
{
};

TEST_F(TryCastTest, TryCast)
{
    auto key = new test::String("aaa");
    auto val = new test::Union(key);
    Object* obj = val;

    auto* casted = tryCast<Union*>(obj);
    ASSERT_NE(casted, nullptr);
    EXPECT_EQ(tryCast<String*>(casted->getValue()), key);
}

TEST_F(TryCastTest, BadTryCast)
{
    auto* arr = new test::Array<test::Number*>();
    arr->push(new test::Number(33.0));
    Object* obj = arr;

    EXPECT_EQ(tryCast<test::Array<test::String*>*>(obj), nullptr);
}
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

#include "../../infrastructure/object_wrappers.h"

class UnionGetValueTest : public test::GlobalTestAllocatorFixture
{
};

TEST_F(UnionGetValueTest, GetUnion)
{
    class Aa : public Object
    {
    public:
        int n = 1245;
    };

    class Bb : public Aa
    {
    };

    Aa* tested = new Aa();
    auto val = new test::Union(tested);

    try
    {
        Aa* casted = val->getValue<Aa*>();
        EXPECT_EQ(casted->n, 1245);
    }
    catch (...)
    {
        FAIL();
    }

    EXPECT_THROW(val->getValue<Bb*>(), std::runtime_error);
    EXPECT_THROW(val->getValue<test::String*>(), std::runtime_error);

    delete tested;
}
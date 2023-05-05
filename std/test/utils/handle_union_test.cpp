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

#include "std/utils/union_handler.h"

class HandleUnionTest : public test::GlobalTestAllocatorFixture
{
};

// let a : number | string
TEST_F(HandleUnionTest, HandleUnion)
{
    auto tunion = new test::Union();
    tunion->setValue(new test::Boolean(true));

    bool called = false;

    handleUnion<Boolean>(tunion,
                         [&called](Boolean* boolean)
                         {
                             called = true;
                             ;
                         });
    EXPECT_TRUE(called);

    handleUnion<String>(tunion, [](String* val) { FAIL(); });
}

void HandleInvalid(Number* val)
{
    FAIL();
}

// let a : RxFlexValue | number;
TEST_F(HandleUnionTest, HandleUnionCustomClass)
{
    class RxFlexValue : public test::Object
    {
    public:
        int m_val = 2345;
    };
    auto tunion = new test::Union();
    tunion->setValue(new RxFlexValue());

    handleUnion<Number>(tunion, HandleInvalid);

    handleUnion<RxFlexValue>(tunion, [](RxFlexValue* val) { EXPECT_EQ(val->m_val, 2345); });
}

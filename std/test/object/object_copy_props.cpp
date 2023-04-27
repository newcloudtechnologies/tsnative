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

class ObjectWithSingleProperty : public test::GlobalTestAllocatorFixture
{
protected:
    void SetUp()
    {
        test::GlobalTestAllocatorFixture::SetUp();

        o.set("key", new test::Number(1.));
    }

    test::Object o;
};

TEST_F(ObjectWithSingleProperty, MethodCopyProps)
{
    test::Object recipient;
    EXPECT_FALSE(recipient.has("key"));

    o.copyPropsTo(&recipient);

    EXPECT_TRUE(recipient.has("key"));
}

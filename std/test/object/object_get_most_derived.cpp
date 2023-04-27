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

class ObjectWithInheritance : public test::GlobalTestAllocatorFixture
{
protected:
    void SetUp()
    {
        test::GlobalTestAllocatorFixture::SetUp();

        superObject.set("parent", &o);
        o.set("super", &superObject);
    }

    test::Object superObject;
    test::Object o;
};

TEST_F(ObjectWithInheritance, MethodGetMostDerived)
{
    auto* mostDerived = superObject.getMostDerived();
    EXPECT_TRUE(mostDerived == &o);
}
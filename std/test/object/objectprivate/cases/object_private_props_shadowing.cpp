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

#include <string>

#include "std/private/tsobject_p.h"

#include "../../../infrastructure/global_test_allocator_fixture.h"
#include "../../../infrastructure/object_wrappers.h"

class ObjectPrivateWithInheritanceChainForPropertiesShadowingExample : public ::test::GlobalTestAllocatorFixture
{
protected:
    void SetUp() override
    {
        ::test::GlobalTestAllocatorFixture::SetUp();

        test::Object* superObject = new test::Object();
        superObject->set(parent, new test::Object(o));
        superObject->set(iKey, &iValue);

        o->set(super, superObject);
    }

    std::string parent{"parent"};
    std::string super{"super"};

    std::string iKey{"i"};

    test::Number iValue{0.1};

    ObjectPrivate* o = new ObjectPrivate;
};

TEST_F(ObjectPrivateWithInheritanceChainForPropertiesShadowingExample, PropertiesShadowing)
{
    // Expect no own property 'i'
    EXPECT_FALSE(o->has(iKey));

    // Expect property 'i' located in 'super' object
    Object* superValue = o->get(super);
    EXPECT_TRUE(superValue->has(iKey));

    {
        // Expect value of property 'i' to be equal to initial value
        Object* value = o->get(iKey);
        EXPECT_FALSE(value->isUndefined());
        EXPECT_TRUE(value->equals(&iValue));
    }

    // Set own property 'i'
    test::Number propValue{10.};
    o->set(iKey, &propValue);

    // Expect own property 'i' is set in most derived object
    EXPECT_TRUE(o->has(iKey));

    {
        // Expect value of property 'i' to be equal to set value
        Object* value = o->get(iKey);
        EXPECT_FALSE(value->isUndefined());
        EXPECT_TRUE(value->equals(&propValue));
    }
}

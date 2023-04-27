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

class ObjectPrivateWithInheritanceChainAndOnlyServiceProperties : public ::test::GlobalTestAllocatorFixture
{
protected:
    void SetUp() override
    {
        ::test::GlobalTestAllocatorFixture::SetUp();

        superObject.set(parent, new test::Object(o));

        o->set(super, &superObject);
    }

    void TearDown() override
    {
        delete o;
    }

    std::string nonExistingKey{"0xf00d"};
    std::string parent{"parent"};
    std::string super{"super"};

    test::Object superObject;
    ObjectPrivate* o = new ObjectPrivate;
};

TEST_F(ObjectPrivateWithInheritanceChainAndOnlyServiceProperties, MethodGet_PositiveStdString)
{
    Object* superVal = o->get(super);
    Object* parentVal = o->get(parent);

    EXPECT_FALSE(superVal->isUndefined());
    EXPECT_FALSE(parentVal->isUndefined());
}

TEST_F(ObjectPrivateWithInheritanceChainAndOnlyServiceProperties, MethodGet_PositiveString)
{
    test::String superKeyTS{super};
    test::String parentKeyTS{parent};

    Object* superVal = o->get(&superKeyTS);
    Object* parentVal = o->get(&parentKeyTS);

    EXPECT_FALSE(superVal->isUndefined());
    EXPECT_FALSE(parentVal->isUndefined());
}

TEST_F(ObjectPrivateWithInheritanceChainAndOnlyServiceProperties, MethodGetKeys)
{
    std::vector<String*> keys = o->getKeys();
    EXPECT_EQ(keys.size(), 0);
}

TEST_F(ObjectPrivateWithInheritanceChainAndOnlyServiceProperties, OperatorIn_Negative)
{
    EXPECT_FALSE(o->operatorIn(nonExistingKey));
}

TEST_F(ObjectPrivateWithInheritanceChainAndOnlyServiceProperties, OperatorIn_Positive)
{
    EXPECT_TRUE(o->operatorIn(parent));
    EXPECT_TRUE(o->operatorIn(super));
}

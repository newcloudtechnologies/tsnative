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

class ObjectPrivateWithInheritanceChainAndSomeNonUniqueProperties : public ::test::GlobalTestAllocatorFixture
{
protected:
    void SetUp() override
    {
        ::test::GlobalTestAllocatorFixture::SetUp();

        test::Object* superObject = new test::Object();
        superObject->set(parent, new test::Object(o));
        superObject->set(iKey, &iSuperValue);

        o->set(super, superObject);
        o->set(iKey, &iValue);
    }

    std::string nonExistingKey{"0xf00d"};
    std::string parent{"parent"};
    std::string super{"super"};

    std::string iKey{"i"};

    test::Number iValue{0.1};
    test::Number iSuperValue{0.2};

    ObjectPrivate* o = new ObjectPrivate;
};

TEST_F(ObjectPrivateWithInheritanceChainAndSomeNonUniqueProperties, MethodGet_NegativeStdString)
{
    Object* value = o->get(nonExistingKey);

    EXPECT_TRUE(value->isUndefined());
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeNonUniqueProperties, MethodGet_NegativeString)
{
    test::String tsKey{nonExistingKey};
    Object* value = o->get(&tsKey);

    EXPECT_TRUE(value->isUndefined());
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeNonUniqueProperties, MethodGet_PositiveStdString)
{
    Object* superValue = o->get(super);
    Object* parentValue = o->get(parent);
    Object* iValue = o->get(iKey);

    EXPECT_FALSE(superValue->isUndefined());
    EXPECT_FALSE(parentValue->isUndefined());
    EXPECT_FALSE(iValue->isUndefined());
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeNonUniqueProperties, MethodGet_PositiveString)
{
    test::String superKeyTS{super};
    test::String parentKeyTS{parent};
    test::String iKeyTS{iKey};

    Object* superValue = o->get(&superKeyTS);
    Object* parentValue = o->get(&parentKeyTS);
    Object* iValue = o->get(&iKeyTS);

    EXPECT_FALSE(superValue->isUndefined());
    EXPECT_FALSE(parentValue->isUndefined());
    EXPECT_FALSE(iValue->isUndefined());
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeNonUniqueProperties, MethodGetKeys)
{
    std::vector<String*> keys = o->getKeys();
    EXPECT_EQ(keys.size(), 1);
}

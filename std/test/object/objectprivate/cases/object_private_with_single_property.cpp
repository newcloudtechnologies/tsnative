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

class ObjectPrivateWithSingleProperty : public ::test::GlobalTestAllocatorFixture
{
protected:
    void SetUp() override
    {
        ::test::GlobalTestAllocatorFixture::SetUp();

        o->set(propertyName, &n);
    }

    void TearDown() override
    {
        delete o;
    }

    std::string nonExistingKey{"0xf00d"};
    std::string propertyName{"propertyName"};
    test::Number n{2.1};
    ObjectPrivate* o = new ObjectPrivate;
};

TEST_F(ObjectPrivateWithSingleProperty, MethodGet_NegativeStdString)
{
    Object* value = o->get(nonExistingKey);
    EXPECT_TRUE(value->isUndefined());
}

TEST_F(ObjectPrivateWithSingleProperty, MethodGet_NegativeString)
{
    test::String key{nonExistingKey};
    Object* value = o->get(&key);
    EXPECT_TRUE(value->isUndefined());
}

TEST_F(ObjectPrivateWithSingleProperty, MethodGet_PositiveStdString)
{
    Object* value = o->get(propertyName);
    EXPECT_FALSE(value->isUndefined());
}

TEST_F(ObjectPrivateWithSingleProperty, MethodGet_PositiveString)
{
    test::String key{propertyName};
    Object* value = o->get(&key);
    EXPECT_FALSE(value->isUndefined());
}

TEST_F(ObjectPrivateWithSingleProperty, MethodGetKeys)
{
    std::vector<String*> keys = o->getKeys();
    EXPECT_EQ(keys.size(), 1);
}

TEST_F(ObjectPrivateWithSingleProperty, OperatorIn_Negative)
{
    EXPECT_FALSE(o->operatorIn(new test::String{nonExistingKey}));
}

TEST_F(ObjectPrivateWithSingleProperty, OperatorIn_Positive)
{
    EXPECT_TRUE(o->operatorIn(new test::String{propertyName}));
}

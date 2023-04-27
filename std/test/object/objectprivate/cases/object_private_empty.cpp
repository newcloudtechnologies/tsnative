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

class ObjectPrivateEmpty : public ::test::GlobalTestAllocatorFixture
{
protected:
    void TearDown()
    {
        delete o;
    }

    std::string nonExistingKey{"0xf00d"};

    ObjectPrivate* o = new ObjectPrivate;
};

TEST_F(ObjectPrivateEmpty, Constructor)
{
    EXPECT_EQ(o->getTSTypeID(), TSTypeID::Object);
}

TEST_F(ObjectPrivateEmpty, MethodGet_NegativeStdString)
{
    Object* value = o->get(nonExistingKey);
    EXPECT_TRUE(value->isUndefined());
}

TEST_F(ObjectPrivateEmpty, MethodGet_NegativeString)
{
    String key{nonExistingKey};
    Object* value = o->get(&key);
    EXPECT_TRUE(value->isUndefined());
}

TEST_F(ObjectPrivateEmpty, MethodGetKeys)
{
    std::vector<String*> keys = o->getKeys();
    EXPECT_EQ(keys.size(), 0);
}

TEST_F(ObjectPrivateEmpty, OperatorIn_Negative)
{
    EXPECT_FALSE(o->operatorIn(nonExistingKey));
}

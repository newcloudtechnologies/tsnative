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

class ObjectPrivateWithInheritanceChainAndSomeProperties : public ::test::GlobalTestAllocatorFixture
{
protected:
    void SetUp() override
    {
        ::test::GlobalTestAllocatorFixture::SetUp();

        superObject.set(parent, new test::Object(o));
        superObject.set(iKey, &iValue);

        o->set(super, &superObject);
        o->set(kKey, &kValue);
    }

    void TearDown() override
    {
        delete o;
    }

    std::string nonExistingKey{"0xf00d"};
    std::string parent{"parent"};
    std::string super{"super"};

    std::string iKey{"i"};
    std::string kKey{"k"};

    test::Number iValue{0.1};
    test::Number kValue{0.2};

    test::Object superObject;
    ObjectPrivate* o = new ObjectPrivate;
};

TEST_F(ObjectPrivateWithInheritanceChainAndSomeProperties, MethodGet_NegativeStdString)
{
    Object* value = o->get(nonExistingKey);

    EXPECT_TRUE(value->isUndefined());
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeProperties, MethodGet_NegativeString)
{
    test::String tsKey{nonExistingKey};
    Object* value = o->get(&tsKey);

    EXPECT_TRUE(value->isUndefined());
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeProperties, MethodGet_PositiveStdString)
{
    Object* superValue = o->get(super);
    Object* parentValue = o->get(parent);
    Object* iValue = o->get(iKey);
    Object* kValue = o->get(kKey);

    EXPECT_FALSE(superValue->isUndefined());
    EXPECT_FALSE(parentValue->isUndefined());
    EXPECT_FALSE(iValue->isUndefined());
    EXPECT_FALSE(kValue->isUndefined());
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeProperties, MethodGet_PositiveString)
{
    test::String superKeyTS{super};
    test::String parentKeyTS{parent};
    test::String iKeyTS{iKey};
    test::String kKeyTS{kKey};

    Object* superValue = o->get(&superKeyTS);
    Object* parentValue = o->get(&parentKeyTS);
    Object* iValue = o->get(&iKeyTS);
    Object* kValue = o->get(&kKeyTS);

    EXPECT_FALSE(superValue->isUndefined());
    EXPECT_FALSE(parentValue->isUndefined());
    EXPECT_FALSE(iValue->isUndefined());
    EXPECT_FALSE(kValue->isUndefined());
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeProperties, MethodGetKeys)
{
    std::vector<String*> keys = o->getKeys();
    EXPECT_EQ(keys.size(), 2);
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeProperties, ForEachProperty_ConstRef)
{
    o->forEachProperty([](const std::pair<String*, Object*>&) {});
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeProperties, ForEachProperty_ConstAutoRef)
{
    o->forEachProperty([](const auto&) {});
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeProperties, ForEachProperty_AutoRef)
{
    o->forEachProperty([](auto&) {});
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeProperties, ForEachProperty_Auto)
{
    o->forEachProperty([](auto) {});
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeProperties, ForEachProperty_Auto_CaptureByValue)
{
    int i = 0;
    o->forEachProperty([=](auto) {});
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeProperties, ForEachProperty_Auto_CaptureByReference)
{
    int i = 0;
    o->forEachProperty([&](auto) {});
}

void visitor(const std::pair<String*, Object*>&)
{
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeProperties, ForEachProperty_FreeFunction)
{
    o->forEachProperty(visitor);
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeProperties, OperatorIn_Negative)
{
    EXPECT_FALSE(o->operatorIn(nonExistingKey));
}

TEST_F(ObjectPrivateWithInheritanceChainAndSomeProperties, OperatorIn_Positive)
{
    EXPECT_TRUE(o->operatorIn(parent));
    EXPECT_TRUE(o->operatorIn(super));
    EXPECT_TRUE(o->operatorIn(iKey));
    EXPECT_TRUE(o->operatorIn(kKey));
}

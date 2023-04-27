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

class ObjectGetTest : public test::GlobalTestAllocatorFixture
{
};

TEST_F(ObjectGetTest, GetUnion)
{
    auto key = new test::String("aaa");
    auto val = new test::Union(key);
    Object* obj = new test::Object();
    obj->set(key, val);

    try
    {
        Union* tsunion = obj->get<Union*>(key->cpp_str());
        ASSERT_NE(tsunion, nullptr);

        Object* unionAsObj = obj->get<Object*>(key->cpp_str());
        ASSERT_NE(unionAsObj, nullptr);
    }
    catch (...)
    {
        FAIL();
    }
}

TEST_F(ObjectGetTest, BadGet)
{
    auto key = new test::String("aaa");
    auto val = new test::Union(key);
    Object* obj = new test::Object();
    obj->set(key, val);

    class A : public Object
    {
    };

    EXPECT_THROW(obj->get<Array<Boolean*>*>(key->cpp_str()), std::runtime_error);
    EXPECT_THROW(obj->get<A*>(key->cpp_str()), std::runtime_error);
}
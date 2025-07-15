#include <gtest/gtest.h>

#include "../infrastructure/object_wrappers.h"

#include "std/utils/assert_cast.h"

class AssertCastTest : public test::GlobalTestAllocatorFixture
{
};

TEST_F(AssertCastTest, CastToArray)
{
    auto* arr = new test::Array<test::Number*>();
    arr->push(new test::Number(33.0));
    Object* obj = arr;

    auto* casted = assertCast<Array<test::Number*>*>(obj);
    ASSERT_NE(casted, nullptr);

    auto length = casted->length();
    EXPECT_TRUE(length->unboxed() == 1);
    delete length;

    EXPECT_EQ((*casted)[size_t(0)]->unboxed(), 33.0);
}

TEST_F(AssertCastTest, BadCastToArray)
{
    auto* arr = new test::Array<test::Number*>();
    arr->push(new test::Number(33.0));
    Object* obj = arr;

    EXPECT_THROW(assertCast<test::Array<test::String*>*>(obj), BadCast);
}

TEST_F(AssertCastTest, CastToUnion)
{
    auto key = new test::String("aaa");
    auto val = new test::Union(key);
    Object* obj = val;

    auto* casted = assertCast<Union*>(obj);
    ASSERT_NE(casted, nullptr);
    EXPECT_EQ(assertCast<String*>(casted->getValue()), key);
}

TEST_F(AssertCastTest, CastFromConstObj)
{
    class A : public Object
    {
    };

    const A* a = new A();
    const Object* obj = a;

    const auto* casted = assertCast<const A*>(obj);
    EXPECT_EQ(casted, a);

    delete a;
}
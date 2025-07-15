#include <gtest/gtest.h>

#include "../infrastructure/object_wrappers.h"

#include "std/utils/cast_from_union.h"

class UnionCastTest : public test::GlobalTestAllocatorFixture
{
};

TEST_F(UnionCastTest, CastFromUnion)
{
    auto tunion = new test::Union();

    EXPECT_THROW(castFromUnion<test::Boolean*>(tunion), std::runtime_error);

    tunion->setValue(new test::Boolean(true));

    EXPECT_EQ(castFromUnion<test::Boolean*>(tunion)->unboxed(), true);
}

TEST_F(UnionCastTest, CastFromNestedUnion)
{
    constexpr auto str = "ab123";

    auto tunion = new test::Union();
    tunion->setValue(new test::String(str));
    tunion = new test::Union(tunion);
    tunion = new test::Union(tunion);

    EXPECT_EQ(castFromUnion<test::String*>(tunion)->cpp_str(), str);
}
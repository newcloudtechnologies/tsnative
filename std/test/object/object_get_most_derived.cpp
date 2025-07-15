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
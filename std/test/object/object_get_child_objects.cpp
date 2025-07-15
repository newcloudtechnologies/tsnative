#include <gtest/gtest.h>

#include "../infrastructure/object_wrappers.h"

class ObjectWithSingleProperty : public test::GlobalTestAllocatorFixture
{
protected:
    void SetUp()
    {
        test::GlobalTestAllocatorFixture::SetUp();

        o.set("key", new test::Number(1.));
    }

    test::Object o;
};

TEST_F(ObjectWithSingleProperty, MethodGetChildObjects)
{
    EXPECT_EQ(o.getChildObjects().size(), 2);
}
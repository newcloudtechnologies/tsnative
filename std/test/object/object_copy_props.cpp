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

TEST_F(ObjectWithSingleProperty, MethodCopyProps)
{
    test::Object recipient;
    EXPECT_FALSE(recipient.has("key"));

    o.copyPropsTo(&recipient);

    EXPECT_TRUE(recipient.has("key"));
}

#include <gtest/gtest.h>

#include "../infrastructure/object_wrappers.h"

class UnionGetValueTest : public test::GlobalTestAllocatorFixture
{
};

TEST_F(UnionGetValueTest, GetUnion)
{
    class Aa : public Object
    {
    public:
        int n = 1245;
    };

    class Bb : public Aa
    {
    };

    Aa* tested = new Aa();
    auto val = new test::Union(tested);

    try
    {
        Aa* casted = val->getValue<Aa*>();
        EXPECT_EQ(casted->n, 1245);
    }
    catch (...)
    {
        FAIL();
    }

    EXPECT_THROW(val->getValue<Bb*>(), BadCast);
    EXPECT_THROW(val->getValue<test::String*>(), BadCast);

    delete tested;
}
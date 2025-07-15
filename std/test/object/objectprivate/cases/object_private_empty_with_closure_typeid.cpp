#include "std/private/tsobject_p.h"

#include "../../../infrastructure/global_test_allocator_fixture.h"

class ObjectPrivateEmptyWithClosureTypeID : public ::test::GlobalTestAllocatorFixture
{
protected:
    void TearDown()
    {
        delete o;
    }

    ObjectPrivate* o = new ObjectPrivate{TSTypeID::Closure};
};

TEST_F(ObjectPrivateEmptyWithClosureTypeID, Constructor)
{
    EXPECT_EQ(o->getTSTypeID(), TSTypeID::Closure);
}

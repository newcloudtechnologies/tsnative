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

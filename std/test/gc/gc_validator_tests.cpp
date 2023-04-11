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

#include "std/private/memory_management/gc_validator.h"

#include "../infrastructure/object_wrappers.h"

class GCValidatorTest : public test::GlobalTestAllocatorFixture
{
};

TEST_F(GCValidatorTest, checkFindingMarked)
{
    GCValidator::Roots rootsAfterSweep;
    GCValidator::Heap heap;

    Object* obj = new test::Object();
    obj->mark();

    rootsAfterSweep.insert(&obj);
    GCValidator validator(heap, rootsAfterSweep);

    EXPECT_NO_THROW(validator.validate());

    auto* prop1 = new test::Object();
    auto* str = new test::String("some_prop");
    obj->set(str, prop1);

    EXPECT_THROW(validator.validate(), std::runtime_error);
}

TEST_F(GCValidatorTest, checkRoots)
{
    GCValidator::Roots roots;
    GCValidator::Heap heap;

    roots.insert(nullptr);
    GCValidator validator(heap, roots);

    EXPECT_THROW(validator.validate(), std::runtime_error);

    roots.clear();
    Object** ptr = new Object*();
    (*ptr) = nullptr;
    roots.insert(ptr);

    EXPECT_THROW(validator.validate(), std::runtime_error);

    delete ptr;
}

TEST_F(GCValidatorTest, deletingObjectNotInTheHeap)
{
    GCValidator::Roots roots;
    GCValidator::Heap heap;

    GCValidator validator(heap, roots);

    {
        std::unique_ptr<test::Object, std::function<void(test::Object*)>> obj(
            new test::Object(),
            [&validator](test::Object* o) { EXPECT_THROW(validator.onObjectAboutToDelete(o), std::runtime_error); });
    }
}

TEST_F(GCValidatorTest, deletingObjectExistedInTheRootsGraph)
{
    GCValidator::Roots roots;
    GCValidator::Heap heap;

    GCValidator validator(heap, roots);

    Object** ptr = new Object*();

    {
        std::unique_ptr<test::Object, std::function<void(test::Object*)>> obj(
            new test::Object(),
            [&validator](test::Object* o) { EXPECT_THROW(validator.onObjectAboutToDelete(o), std::runtime_error); });

        heap.insert(obj.get());

        (*ptr) = obj.get();
        roots.insert(ptr);
    }

    delete ptr;
}
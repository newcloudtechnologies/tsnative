#include <gtest/gtest.h>

#include "std/private/memory_management/gc_validator.h"

#include "../infrastructure/object_wrappers.h"

class GCValidatorTest : public test::GlobalTestAllocatorFixture
{
};

TEST_F(GCValidatorTest, checkFindingMarked)
{
    Roots rootsAfterSweep;
    UniqueObjects heap;
    UniqueConstObjects marked;

    Object* obj = new test::Object();

    marked.insert(obj);

    rootsAfterSweep.insert(&obj);
    GCValidator validator(heap, rootsAfterSweep, marked);

    EXPECT_NO_THROW(validator.validate());

    auto* prop1 = new test::Object();
    auto* str = new test::String("some_prop");
    obj->set(str, prop1);

    EXPECT_THROW(validator.validate(), std::runtime_error);
}

TEST_F(GCValidatorTest, checkRoots)
{
    Roots roots;
    UniqueObjects heap;
    UniqueConstObjects marked;

    roots.insert(nullptr);
    GCValidator validator(heap, roots, marked);

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
    Roots roots;
    UniqueObjects heap;
    UniqueConstObjects marked;

    GCValidator validator(heap, roots, marked);

    {
        std::unique_ptr<test::Object, std::function<void(test::Object*)>> obj(
            new test::Object(),
            [&validator](test::Object* o) { EXPECT_THROW(validator.onObjectAboutToDelete(o), std::runtime_error); });
    }
}

TEST_F(GCValidatorTest, deletingObjectExistedInTheRootsGraph)
{
    Roots roots;
    UniqueObjects heap;
    UniqueConstObjects marked;

    GCValidator validator(heap, roots, marked);

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
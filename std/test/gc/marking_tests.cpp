/*#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include "../infrastructure/global_test_allocator_fixture.h"
#include "../infrastructure/object_wrappers.h"

#include <memory>
#include <vector>

namespace
{

MATCHER_P(IsMarked, state, "") { return arg->isMarked() == state; }

class MarkingTestFixture : public test::GlobalTestAllocatorFixture
{
public:
    void SetUp() override
    {
        TestAllocator::Callbacks allocatorCallbacks;
        allocatorCallbacks.onAllocated = [this] (void* o)
        {
            auto* obj = static_cast<::Object*>(o);
            _actualAllocatedObjects.push_back(obj);
        };
        _allocator = std::make_unique<TestAllocator>(std::move(allocatorCallbacks));
    }

    void TearDown() override
    {
        _allocator = nullptr;

        for (auto* o : _actualAllocatedObjects)
        {
            delete o;
        }

        _actualAllocatedObjects.clear();
    }


    const std::vector<Object*>& getActualAllocatedObjects() const
    {
        return _actualAllocatedObjects;
    }

private:
    std::vector<Object*> _actualAllocatedObjects;
};

TEST_F(MarkingTestFixture, object)
{
    auto o = new test::Object();
    o->set("child", new test::Object());

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(2u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    o->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, boolean)
{
    auto boolean = new test::Boolean(true);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    boolean->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, null)
{
    auto null = new test::Null();

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    null->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, undefined)
{
    auto undefined = new test::Undefined();

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    undefined->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, string)
{
    auto string = new test::String("Abacaba");

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    string->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, number)
{
    auto number = new test::Number(10);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    number->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, date)
{
    auto date = new test::Date();

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(1u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    date->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, union)
{
    auto child = new test::Object();
    auto u = new test::Union(child);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(2u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    u->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

void closureBody() {};

TEST_F(MarkingTestFixture, closure)
{
    void* env[] = {new test::Object(), new test::Object()}; // should be marked

    auto* numArgs = new test::Number(2); // should be marked
    ::Number optionals(0.f); // should NOT be marked

    void* closureBodyVoidStar = (void*)(&closureBody);
    auto closure = new test::Closure(closureBodyVoidStar, env, numArgs, &optionals);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(4u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    closure->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, array)
{
    auto arr = new test::Array<Object*>();
    arr->push(new test::Object());

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(2u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    arr->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, tuple)
{
    auto tuple = new test::Tuple();
    tuple->push(new test::Object());

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(2u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    tuple->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, set)
{
    auto set = new test::Set<Object*>();
    set->add(new test::Object());

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(2u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    set->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

TEST_F(MarkingTestFixture, map)
{
    auto map = new test::Map<Object*, Object*>();
    auto key = new test::Object();
    auto value = new test::Object();

    map->set(key, value);

    const auto& allObjects = getActualAllocatedObjects();
    EXPECT_EQ(3u, allObjects.size());
    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(false)));

    map->mark();

    EXPECT_THAT(allObjects, ::testing::Each(IsMarked(true)));
}

} // anonymous namespace
*/
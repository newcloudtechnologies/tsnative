#include "../infrastructure/global_test_allocator_fixture.h"
#include "../infrastructure/object_factory.h"

#include <gtest/gtest.h>

namespace
{
class ArraySpliceTestFixture : public test::GlobalTestAllocatorFixture
{
};

std::vector<int> toIntVector(const std::vector<test::Number*>& array)
{
    std::vector<int> result;

    for (std::size_t i = 0; i < array.size(); ++i)
    {
        const auto number = array[i]->unboxed();
        result.push_back(static_cast<int>(number));
    }

    return result;
}

TEST_F(ArraySpliceTestFixture, spliceWithBooleanFalse)
{
    auto array = new test::Array<test::Number*>();
    array->push(new test::Number(1));
    array->push(new test::Number(2));
    array->push(new test::Number(3));

    auto start = new test::Number(1);
    auto deleteCount = new test::Union(new test::Boolean(false));

    const auto* const result = array->splice(start, deleteCount);

    const auto removed = toIntVector(result->toStdVector());
    const auto left = toIntVector(array->toStdVector());

    const std::vector<int> expectedLeft{1, 2, 3};
    const std::vector<int> expectedRemoved{};

    EXPECT_THAT(removed, ::testing::ElementsAreArray(expectedRemoved));
    EXPECT_THAT(left, ::testing::ElementsAreArray(expectedLeft));
}

TEST_F(ArraySpliceTestFixture, spliceWithBooleanTrue)
{
    auto array = new test::Array<test::Number*>();
    array->push(new test::Number(1));
    array->push(new test::Number(2));
    array->push(new test::Number(3));

    auto start = new test::Number(1);
    auto deleteCount = new test::Union(new test::Boolean(true));

    const auto result = array->splice(start, deleteCount);

    const auto removed = toIntVector(result->toStdVector());
    const auto left = toIntVector(array->toStdVector());

    const std::vector<int> expectedLeft{1, 3};
    const std::vector<int> expectedRemoved{2};

    EXPECT_THAT(removed, ::testing::ElementsAreArray(expectedRemoved));
    EXPECT_THAT(left, ::testing::ElementsAreArray(expectedLeft));
}

TEST_F(ArraySpliceTestFixture, spliceWithDeleteCountUndefined)
{
    auto array = new test::Array<test::Number*>();
    array->push(new test::Number(1));
    array->push(new test::Number(2));
    array->push(new test::Number(3));

    auto start = new test::Number(1);
    auto deleteCount = new test::Union(Undefined::instance());

    const auto result = array->splice(start, deleteCount);

    const auto removed = toIntVector(result->toStdVector());
    const auto left = toIntVector(array->toStdVector());

    const std::vector<int> expectedLeft{1};
    const std::vector<int> expectedRemoved{2, 3};

    EXPECT_THAT(removed, ::testing::ElementsAreArray(expectedRemoved));
    EXPECT_THAT(left, ::testing::ElementsAreArray(expectedLeft));
}

TEST_F(ArraySpliceTestFixture, spliceWithDeleteCountNull)
{
    auto array = new test::Array<test::Number*>();
    array->push(new test::Number(1));
    array->push(new test::Number(2));
    array->push(new test::Number(3));

    auto start = new test::Number(1);
    auto deleteCount = new test::Union(Null::instance());

    const auto result = array->splice(start, deleteCount);

    const auto removed = toIntVector(result->toStdVector());
    const auto left = toIntVector(array->toStdVector());

    const std::vector<int> expectedLeft{1, 2, 3};
    const std::vector<int> expectedRemoved{};

    EXPECT_THAT(removed, ::testing::ElementsAreArray(expectedRemoved));
    EXPECT_THAT(left, ::testing::ElementsAreArray(expectedLeft));
}

TEST_F(ArraySpliceTestFixture, spliceWithDeleteCountString)
{
    auto array = new test::Array<test::Number*>();
    array->push(new test::Number(1));
    array->push(new test::Number(2));
    array->push(new test::Number(3));

    auto start = new test::Number(1);
    auto deleteCount = new test::Union(new test::String("abacaba"));

    const auto result = array->splice(start, deleteCount);

    const auto removed = toIntVector(result->toStdVector());
    const auto left = toIntVector(array->toStdVector());

    const std::vector<int> expectedLeft{1, 2, 3};
    const std::vector<int> expectedRemoved{};

    EXPECT_THAT(removed, ::testing::ElementsAreArray(expectedRemoved));
    EXPECT_THAT(left, ::testing::ElementsAreArray(expectedLeft));
}

} // namespace
#include "../infrastructure/array_fixture.h"
#include "../infrastructure/object_wrappers.h"
#include "std/make_closure_from_lambda.h"
#include "std/tsnumber.h"
#include "std/tsunion.h"

#include <gtest/gtest.h>

#include <functional>
#include <string>

namespace
{

class SortArrayFixture : public ArrayFixture
{
    template <typename T>
    using Comparator = test::Number*(T a, T b);

public:
    template <typename T>
    test::Union* makeComparator(std::function<Comparator<T>> comparator = nullptr) const
    {
        auto* result = new test::Union();

        if (comparator)
        {
            auto f = [comparator](T* a, T* b) { return comparator(*a, *b); };
            auto* closure = makeClosure<test::Closure>(std::move(f));
            result->setValue(closure);
        }

        return result;
    }
};

TEST_F(SortArrayFixture, ascending_sort)
{
    auto* numbers = getUnorderedNumberArray();

    const auto left1 = IntArray::toVector(numbers);

    EXPECT_THAT(left1, ::testing::ElementsAreArray({44, 16, 32, 78, 1, 36, 8, 17, 6, 12}));

    auto* comparator = makeComparator<test::Number*>([](test::Number* a, test::Number* b)
                                                     { return new test::Number(a->unboxed() - b->unboxed()); });

    numbers->sort(comparator);

    const auto left2 = IntArray::toVector(numbers);
    EXPECT_THAT(left2, ::testing::ElementsAreArray({1, 6, 8, 12, 16, 17, 32, 36, 44, 78}));
}

TEST_F(SortArrayFixture, descending_sort)
{
    auto* numbers = getUnorderedNumberArray();

    const auto left1 = IntArray::toVector(numbers);

    EXPECT_THAT(left1, ::testing::ElementsAreArray({44, 16, 32, 78, 1, 36, 8, 17, 6, 12}));

    auto* comparator = makeComparator<test::Number*>([](test::Number* a, test::Number* b)
                                                     { return new test::Number(b->unboxed() - a->unboxed()); });

    numbers->sort(comparator);

    const auto left2 = IntArray::toVector(numbers);
    EXPECT_THAT(left2, ::testing::ElementsAreArray({78, 44, 36, 32, 17, 16, 12, 8, 6, 1}));
}

TEST_F(SortArrayFixture, default_numbers_sort)
{
    auto* numbers = getUnorderedNumberArray();

    const auto left1 = IntArray::toVector(numbers);

    EXPECT_THAT(left1, ::testing::ElementsAreArray({44, 16, 32, 78, 1, 36, 8, 17, 6, 12}));

    auto* comparator = makeComparator<test::Number*>();

    numbers->sort(comparator);

    const auto left2 = IntArray::toVector(numbers);
    EXPECT_THAT(left2, ::testing::ElementsAreArray({1, 12, 16, 17, 32, 36, 44, 6, 78, 8}));
}

TEST_F(SortArrayFixture, default_strings_sort)
{
    test::Array<test::String*>* items = getUnorderedStringArray();

    const auto left1 = StringArray::toVector(items);

    EXPECT_THAT(left1,
                ::testing::ElementsAreArray(
                    {"red", "green", "yellow", "white", "blue", "black", "pink", "brown", "cyan", "gray", "magenta"}));

    auto* comparator = makeComparator<test::String*>();

    items->sort(comparator);

    const auto left2 = StringArray::toVector(items);

    EXPECT_THAT(left2,
                ::testing::ElementsAreArray(
                    {"black", "blue", "brown", "cyan", "gray", "green", "magenta", "pink", "red", "white", "yellow"}));
}

} // namespace

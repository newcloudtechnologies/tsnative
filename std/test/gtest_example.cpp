#include <gtest/gtest.h>

#include "std/tsmath.h"
#include "std/tsnumber.h"

TEST(gtest_example, max1015) {
    auto a = new Number{10};
    auto b = new Number{15};
    auto result = Math::max(a, b);
    EXPECT_EQ(15, result->unboxed());
}
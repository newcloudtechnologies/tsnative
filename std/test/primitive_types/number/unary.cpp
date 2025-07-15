#include "std/private/tsnumber_cxx_builtin_p.h"

#include <gtest/gtest.h>

TEST(NumberCXXBuiltinPrivate, checkNegatePositiveNumber)
{
    NumberCXXBuiltinPrivate num(12345);

    EXPECT_EQ(num.negate(), -12345);
    EXPECT_EQ(num.unboxed(), 12345);
}

TEST(NumberCXXBuiltinPrivate, checkNegateNegativeNumber)
{
    NumberCXXBuiltinPrivate num(-12345);

    EXPECT_EQ(num.negate(), 12345);
    EXPECT_EQ(num.unboxed(), -12345);
}

TEST(NumberCXXBuiltinPrivate, checkNegateZero)
{
    NumberCXXBuiltinPrivate num(-0.0);

    EXPECT_EQ(num.negate(), 0.0);
}

TEST(NumberCXXBuiltinPrivate, checkNegateInf)
{
    NumberCXXBuiltinPrivate num(std::numeric_limits<double>::infinity());

    EXPECT_EQ(num.negate(), -std::numeric_limits<double>::infinity());
}
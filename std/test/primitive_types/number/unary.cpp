/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

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
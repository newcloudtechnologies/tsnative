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

#include "std/private/promise/expected.h"

TEST(ExpectedTest, checkVoidCreateSuccess)
{
    auto result = Expected<void, std::string>::makeValue();
    EXPECT_TRUE(result);
}

TEST(ExpectedTest, checkVoidCreateError)
{
    auto result = Expected<void, std::string>::makeError("Error");

    EXPECT_FALSE(result);
    EXPECT_EQ(result.getError(), "Error");
}

TEST(ExpectedTest, checkVoidSwapIfHasTwoExpectedIsError)
{
    using E = Expected<void, std::string>;

    auto result1 = Expected<void, std::string>::makeError("Error1");
    auto result2 = Expected<void, std::string>::makeError("Error2");

    result1.swap(result2);

    EXPECT_FALSE(result1);
    EXPECT_FALSE(result2);
    EXPECT_EQ(result1.getError(), "Error2");
    EXPECT_EQ(result2.getError(), "Error1");
}

TEST(ExpectedTest, checkVoidAssignAndSwap)
{
    using E = Expected<void, std::string>;

    auto result1 = E::makeError("Error1");
    auto result2 = E::makeError("Error2");

    result1 = E::makeError("Error");
    result2 = E::makeValue();

    result1.swap(result2);
    EXPECT_TRUE(result1);
    EXPECT_FALSE(result2);
    EXPECT_EQ(result2.getError(), "Error");
}

TEST(ExpectedTest, checkVoidCopy)
{
    using E = Expected<void, std::string>;

    auto result1 = E::makeError("Error1");
    auto result2 = E::makeError("Error2");

    result1 = result2;

    EXPECT_FALSE(result1);
    EXPECT_FALSE(result2);
    EXPECT_EQ(result2.getError(), result1.getError());

    result1 = E::makeValue();
    result2 = E::makeError("Error2");
    result1 = result2;

    EXPECT_FALSE(result1);
    EXPECT_FALSE(result2);
    EXPECT_EQ(result2.getError(), result1.getError());

    result1 = E::makeError("Error2");
    result2 = E::makeValue();

    result1 = result2;
    EXPECT_TRUE(result1);
    EXPECT_TRUE(result2);
}

TEST(ExpectedTest, checkNotVoidCreateSuccess)
{
    auto result = Expected<std::string, std::string>::makeValue("RESULT");

    EXPECT_TRUE(result);
    EXPECT_EQ(result.get(), "RESULT");
    EXPECT_EQ(*result.getIf(), "RESULT");
    EXPECT_EQ(result->at(0), 'R');
    EXPECT_EQ(*result, "RESULT");
}

TEST(ExpectedTest, checkNotVoidCreateError)
{
    auto result = Expected<std::string, std::string>::makeError("ERROR");
    EXPECT_FALSE(result);
    EXPECT_EQ(result.getError(), "ERROR");
    EXPECT_EQ(result.getIf(), nullptr);
}

TEST(ExpectedTest, checkNotVoidSwapIfHasTwoExpectedIsError)
{
    using E = Expected<std::string, std::string>;

    auto result1 = E::makeError("Error1");
    auto result2 = E::makeError("Error2");

    result1.swap(result2);

    EXPECT_FALSE(result1);
    EXPECT_FALSE(result2);
    EXPECT_EQ(result1.getError(), "Error2");
    EXPECT_EQ(result2.getError(), "Error1");
    EXPECT_EQ(result2.getIf(), nullptr);
    EXPECT_EQ(result2.getIf(), result1.getIf());
}

TEST(ExpectedTest, checkNotVoidSwapIfHasTwoExpectedIsErrorAndSuccess)
{
    using E = Expected<std::string, std::string>;

    auto result1 = E::makeError("Error");
    auto result2 = E::makeValue("Result");

    result1.swap(result2);

    EXPECT_TRUE(result1);
    EXPECT_FALSE(result2);
    EXPECT_EQ(result1.get(), "Result");
    EXPECT_EQ(result2.getError(), "Error");
    EXPECT_EQ(result2.getIf(), nullptr);
    EXPECT_EQ(*result1.getIf(), "Result");
    EXPECT_EQ(result1.get(), "Result");
    EXPECT_EQ(*result1, "Result");
}

TEST(ExpectedTest, checkNotVoidCopyIfHasTwoExpectedIsError)
{
    using E = Expected<std::string, std::string>;

    auto result1 = Expected<std::string, std::string>::makeError("Error1");
    auto result2 = Expected<std::string, std::string>::makeError("Error2");

    result1 = result2;

    EXPECT_FALSE(result1);
    EXPECT_FALSE(result2);
    EXPECT_EQ(result2.getError(), result1.getError());
}

TEST(ExpectedTest, checkNotVoidCopyIfHasTwoExpectedIsErrorAndSuccess)
{
    using E = Expected<std::string, std::string>;

    auto result1 = Expected<std::string, std::string>::makeValue("Value");
    auto result2 = Expected<std::string, std::string>::makeError("Error");

    result1 = result2;

    EXPECT_FALSE(result1);
    EXPECT_FALSE(result2);
    EXPECT_EQ(result2.getError(), result1.getError());
}

TEST(ExpectedTest, checkNotVoidCopyIfHasTwoExpectedIsSuccess)
{
    auto result1 = Expected<std::string, std::string>::makeValue("Value1");
    auto result2 = Expected<std::string, std::string>::makeValue("Value2");

    result1 = result2;

    EXPECT_TRUE(result1);
    EXPECT_TRUE(result2);
    EXPECT_EQ(*result1, "Value2");
    EXPECT_EQ(*result1, *result2);
}

TEST(ExpectedTest, checkTraits)
{
    using Exp = Expected<int, std::string>;

    EXPECT_FALSE(std::is_default_constructible<Exp>::value);
    EXPECT_FALSE(noexcept(Exp::makeValue()));
    EXPECT_FALSE(noexcept(Exp::makeError()));
    EXPECT_FALSE(noexcept(std::declval<Exp>().get()));
    EXPECT_FALSE(noexcept(std::declval<Exp>().getError()));
    EXPECT_FALSE(noexcept(std::declval<Exp>().operator*()));
    EXPECT_TRUE(noexcept(std::declval<Exp>().getIf()));
    EXPECT_TRUE(std::is_move_constructible<Exp>::value);
}

#define ASSERT_THROW_KEEP_AS_E(statement, expectedException)                                 \
    std::exception_ptr exceptionPtr;                                                         \
    try                                                                                      \
    {                                                                                        \
        (statement);                                                                         \
        FAIL() << "Expected: " #statement " throws an exception of type " #expectedException \
                  ".\n  Actual: it throws nothing.";                                         \
    }                                                                                        \
    catch (expectedException const&)                                                         \
    {                                                                                        \
        exceptionPtr = std::current_exception();                                             \
    }                                                                                        \
    catch (...)                                                                              \
    {                                                                                        \
        FAIL() << "Expected: " #statement " throws an exception of type " #expectedException \
                  ".\n  Actual: it throws a different type.";                                \
    }                                                                                        \
    try                                                                                      \
    {                                                                                        \
        std::rethrow_exception(exceptionPtr);                                                \
    }                                                                                        \
    catch (expectedException const& e)

TEST(ExpectedTest, checkExceptionNonVoidExpectedGetValue)
{
    auto result = Expected<int, std::string>::makeError("Error");

    ASSERT_THROW_KEEP_AS_E(result.get(), std::logic_error)
    {
        ASSERT_STREQ("Expected<T, E> contains no value. Missing value", e.what());
    }
    EXPECT_FALSE(result);
    EXPECT_EQ(result.getError(), "Error");
}

TEST(ExpectedTest, checkExceptionNonVoidExpectedGetError)
{
    auto result = Expected<int, std::string>::makeValue(42);

    ASSERT_THROW_KEEP_AS_E(result.getError(), std::logic_error)
    {
        ASSERT_STREQ("There is no error in this Expected<T, E>", e.what());
    }
}

TEST(ExpectedTest, checkExceptionVoidExpected)
{
    auto result = Expected<void, std::string>::makeValue();

    ASSERT_THROW_KEEP_AS_E(result.getError(), std::logic_error)
    {
        ASSERT_STREQ("There is no error in this Expected<void, E>", e.what());
    }
}
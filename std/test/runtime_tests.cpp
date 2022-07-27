#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include "std/runtime.h"
#include "std/tsarray.h"
#include "equality_checkers.h"

TEST(RuntimeTests, initRuntimeTwice) 
{
    const int ac = 0;
    char** av;

    const auto initResult = Runtime::init(ac, av);
    ASSERT_EQ(0, initResult);

    ASSERT_THROW(Runtime::init(ac, av), std::runtime_error);
    Runtime::destroy();
}

TEST(RuntimeTests, emptyCmdArgs) 
{
    const int ac = 0;
    char** av;

    const auto initResult = Runtime::init(ac, av);
    ASSERT_EQ(0, initResult);

    const auto* arr = Runtime::getCmdArgs();

    ASSERT_NE(nullptr, arr);
    ASSERT_NE(nullptr, arr->length());
    EXPECT_EQ(0u, arr->length()->unboxed());

    Runtime::destroy();
}

TEST(RuntimeTests, simpleCmdArgs) 
{
    const int ac = 2;
    char abacaba[] = {"abacaba"};
    char rama[] = {"rama"};
    const std::vector<std::string> expected {abacaba, rama};

    // Avoid ISO C++ forbids converting a string constant to 'char*'
    char* av[] = {abacaba, rama};

    const auto initResult = Runtime::init(ac, av);
    ASSERT_EQ(0, initResult);

    const auto* arr = Runtime::getCmdArgs();

    ASSERT_NE(nullptr, arr);
    const auto actual = arr->toStdVector();

    EXPECT_THAT(actual, ::testing::ElementsAreArray(expected));

    Runtime::destroy();
}

TEST(RuntimeTests, argvSizeLessThanArgs) 
{
    const int ac = 1;
    
    char abacaba[] = "abacaba";
    char rama[] = "rama";

    const std::vector<std::string> expected {abacaba};
    
    // Avoid ISO C++ forbids converting a string constant to 'char*'
    char* av[] = {abacaba, rama};

    const auto initResult = Runtime::init(ac, av);
    ASSERT_EQ(0, initResult);

    const auto* arr = Runtime::getCmdArgs();

    ASSERT_NE(nullptr, arr);
    const auto actual = arr->toStdVector();

    EXPECT_THAT(actual, ::testing::ElementsAreArray(expected));

    Runtime::destroy();
}
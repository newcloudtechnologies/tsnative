#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include "std/runtime.h"
#include "std/tsarray.h"
#include "infrastructure/equality_checkers.h"

class RuntimeTestFixture : public ::testing::Test
{
public:
    void TearDown() override
    {
        Runtime::destroy();
    }
};

TEST_F(RuntimeTestFixture, initRuntimeTwice) 
{
    const int ac = 0;
    char** av;

    const auto initResult = Runtime::init(ac, av);
    ASSERT_EQ(0, initResult);

    ASSERT_THROW(Runtime::init(ac, av), std::runtime_error);
}

TEST_F(RuntimeTestFixture, emptyCmdArgs) 
{
    const int ac = 0;
    char** av;

    const auto initResult = Runtime::init(ac, av);
    ASSERT_EQ(0, initResult);

    const auto* arr = Runtime::getCmdArgs();

    ASSERT_NE(nullptr, arr);
    ASSERT_NE(nullptr, arr->length());
    EXPECT_EQ(0u, arr->length()->unboxed());
}

TEST_F(RuntimeTestFixture, simpleCmdArgs) 
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
}

TEST_F(RuntimeTestFixture, argvSizeLessThanArgs) 
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
}
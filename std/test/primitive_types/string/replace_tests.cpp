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

#include "std/private/tsstring_std_p.h"

TEST(StdStringBackend, checkReplace)
{
    const std::string originalStr("Hello, world!");

    const StdStringBackend str(originalStr);

    auto result = str.replace("world", "universe");

    EXPECT_EQ(result, "Hello, universe!");
    EXPECT_EQ(str.cpp_str(), originalStr);
}

TEST(StdStringBackend, checkReplaceAll)
{
    auto result = StdStringBackend("Hello, world!").replace("Hello, world!", "");

    EXPECT_EQ(result, "");
}

TEST(StdStringBackend, checkReplaceToEmptyStr)
{
    const std::string originalStr("Hello, world!");

    const StdStringBackend str(originalStr);

    auto result = str.replace("world", "");

    EXPECT_EQ(result, "Hello, !");
}

TEST(StdStringBackend, checkReplaceOnlyFirstSubstr)
{
    const std::string originalStr("hello-hello hello");

    const StdStringBackend str(originalStr);

    auto result = str.replace("hello", "AAA");

    EXPECT_EQ(result, "AAA-hello hello");
}

TEST(StdStringBackend, checkReplaceNotFound)
{
    const std::string originalStr("hello-hello hello");

    const StdStringBackend str(originalStr);

    auto result = str.replace("Not found", "~~~~~~~");

    EXPECT_EQ(result, originalStr);
}

TEST(StdStringBackend, checkBigReplaceNotFound)
{
    const std::string originalStr("hello-hello hello");

    auto result = StdStringBackend(originalStr).replace("hellohellohellohellohellohello", "~~");

    EXPECT_EQ(result, originalStr);
}

TEST(StdStringBackend, checkReplaceForEmptyString)
{
    const std::string originalStr("");

    const StdStringBackend str(originalStr);

    auto result = str.replace("Not found", "~~~~~~~");

    EXPECT_EQ(result, originalStr);
}

TEST(StdStringBackend, checkReplaceEmptySubstr)
{
    const std::string originalStr("abc123");

    const StdStringBackend str(originalStr);

    auto result = str.replace("", "~~");

    EXPECT_EQ(result, "~~" + originalStr);
}

TEST(StdStringBackend, checkReplaceEmptySubstrForEmptyStr)
{
    auto result = StdStringBackend("").replace("", "rr ");

    EXPECT_EQ(result, "rr ");
}

TEST(StdStringBackend, checkReplaceToBigStr)
{
    const std::string originalStr("abcd");

    const StdStringBackend str(originalStr);

    const std::string bigStr("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");

    auto result = str.replace("d", bigStr);

    EXPECT_EQ(result, "abc" + bigStr);
}
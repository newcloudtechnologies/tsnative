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

#include <gmock/gmock.h>
#include <gtest/gtest.h>

#include "infrastructure/equality_checkers.h"

#include "mocks/stub_event_loop.h"
#include "std/event_loop.h"

#include "infrastructure/global_test_allocator_fixture.h"

#include "std/memory_diagnostics.h"
#include "std/private/memory_management/memory_manager.h"
#include "std/tsobject_owner.h"

#include "std/runtime.h"
#include "std/tsarray.h"

namespace
{

class RuntimeTestFixture : public ::testing::Test
{
public:
    void TearDown() override
    {
        Runtime::destroy();
    }
};

TEST_F(RuntimeTestFixture, runCustomEventLoop)
{
    const int ac = 0;
    char** av;

    auto eventLoop = new test::StubEventLoop();

    const auto initResult = Runtime::init(ac, av, eventLoop);
    ASSERT_EQ(0, initResult);

    EXPECT_FALSE(eventLoop->isRunning());

    auto eventLoopWrapper = Runtime::getLoop();
    eventLoopWrapper->run();

    EXPECT_TRUE(eventLoop->isRunning());
}

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
    const std::vector<std::string> expected{abacaba, rama};

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

    const std::vector<std::string> expected{abacaba};

    // Avoid ISO C++ forbids converting a string constant to 'char*'
    char* av[] = {abacaba, rama};

    const auto initResult = Runtime::init(ac, av);
    ASSERT_EQ(0, initResult);

    const auto* arr = Runtime::getCmdArgs();

    ASSERT_NE(nullptr, arr);
    const auto actual = arr->toStdVector();

    EXPECT_THAT(actual, ::testing::ElementsAreArray(expected));
}

TEST_F(RuntimeTestFixture, simpleCheckObjOwner)
{
    const int ac = 0;
    char** av;

    const auto initResult = Runtime::init(ac, av);
    ASSERT_EQ(0, initResult);

    const auto createElements = [this]
    {
        auto locker = make_object_owner(new Number(44.56));
        return locker;
    };

    auto memInfo = make_object_owner(Runtime::getMemoryManager()->getMemoryDiagnostics());
    auto gc = make_object_owner(Runtime::getMemoryManager()->getGC());

    gc->collect();

    // 2 - gc + memInfo
    EXPECT_EQ(2, memInfo->getAliveObjectsCount()->unboxed());

    gc->collect();

    EXPECT_EQ(2, memInfo->getAliveObjectsCount()->unboxed());

    {
        gc->collect();

        auto locker = createElements();
        auto locker2 = createElements();
        auto locker3 = createElements();

        TSObjectOwner<Number> lockerTemp;
        lockerTemp = make_object_owner(new Number(22));

        double val = locker->unboxed();

        EXPECT_DOUBLE_EQ(val, 44.56);

        gc->collect();

        EXPECT_EQ(2 + 4, memInfo->getAliveObjectsCount()->unboxed());

        // touch memory to check validity
        gc->saveMemoryGraph();
    }

    gc->collect();

    EXPECT_EQ(2, memInfo->getAliveObjectsCount()->unboxed());
}

TEST_F(RuntimeTestFixture, checkDeletingObjectsWithoutOwner)
{
    const int ac = 0;
    char** av;

    const auto initResult = Runtime::init(ac, av);
    ASSERT_EQ(0, initResult);

    const auto createElementWithoutOwner = [this] { return new Number(44.56); };

    auto memInfo = make_object_owner(Runtime::getMemoryManager()->getMemoryDiagnostics());
    auto gc = make_object_owner(Runtime::getMemoryManager()->getGC());

    gc->collect();

    // 2 - gc + memInfo
    EXPECT_EQ(2, memInfo->getAliveObjectsCount()->unboxed());

    gc->collect();

    EXPECT_EQ(2, memInfo->getAliveObjectsCount()->unboxed());

    {
        gc->collect();

        auto el = createElementWithoutOwner();
        auto el2 = createElementWithoutOwner();
        auto el3 = createElementWithoutOwner();

        EXPECT_EQ(2 + 3, memInfo->getAliveObjectsCount()->unboxed());

        // deleting elements here
        // cannot use el, el2 and el3 anymore
        gc->collect();

        EXPECT_EQ(2, memInfo->getAliveObjectsCount()->unboxed());
    }

    gc->collect();

    EXPECT_EQ(2, memInfo->getAliveObjectsCount()->unboxed());
}

TEST_F(RuntimeTestFixture, checkEmptyOwner)
{
    const int ac = 0;
    char** av;

    const auto initResult = Runtime::init(ac, av);
    ASSERT_EQ(0, initResult);

    {
        TSObjectOwner<Number> el;
        el = {}; // check no crash occurs

        EXPECT_EQ(el.empty(), true);

        el = make_object_owner(new Number(123));
        EXPECT_EQ(el.empty(), false);
    }
}

TEST_F(RuntimeTestFixture, checkDestroyOwnerAfterRuntime)
{
    const int ac = 0;
    char** av;

    const auto initResult = Runtime::init(ac, av);
    ASSERT_EQ(0, initResult);

    try
    {
        TSObjectOwner<Number> empty;
        TSObjectOwner<Number> nonEmpty = make_object_owner(new Number(33.21));

        Runtime::destroy();
    }
    catch (...)
    {
        FAIL() << "No exception should be thrown";
    }
}

TEST_F(RuntimeTestFixture, checkTSObjectOwnerCopyConstructible)
{
    const int ac = 0;
    char** av;

    const auto initResult = Runtime::init(ac, av);
    ASSERT_EQ(0, initResult);

    auto memInfo = make_object_owner(Runtime::getMemoryManager()->getMemoryDiagnostics());
    auto gc = make_object_owner(Runtime::getMemoryManager()->getGC());

    TSObjectOwner<Number> owner{make_object_owner(new Number(33.21))};
    ASSERT_EQ(1, owner.useCount());

    TSObjectOwner<Number> copy{owner};
    ASSERT_EQ(2, copy.useCount());
    ASSERT_EQ(2, owner.useCount());

    gc->collect();

    // 3 - gc + memInfo + Number shared by two TSObjectOwners
    EXPECT_EQ(3, memInfo->getAliveObjectsCount()->unboxed());

    // release Number held by 'copy'
    copy = {};
    gc->collect();

    // 3 - gc + memInfo + Number held by TSObjectOwner (owner)
    EXPECT_EQ(3, memInfo->getAliveObjectsCount()->unboxed());

    // release Number held by 'owner'
    owner = {};
    gc->collect();

    // 2 - gc + memInfo
    EXPECT_EQ(2, memInfo->getAliveObjectsCount()->unboxed());
}

TEST_F(RuntimeTestFixture, checkTSObjectOwnerCopyAssignable)
{
    const int ac = 0;
    char** av;

    const auto initResult = Runtime::init(ac, av);
    ASSERT_EQ(0, initResult);

    auto memInfo = make_object_owner(Runtime::getMemoryManager()->getMemoryDiagnostics());
    auto gc = make_object_owner(Runtime::getMemoryManager()->getGC());

    TSObjectOwner<Number> copy;
    ASSERT_EQ(0, copy.useCount());

    {
        TSObjectOwner<Number> owner = make_object_owner(new Number(33.21));
        ASSERT_EQ(1, owner.useCount());

        copy = owner;
        ASSERT_EQ(2, copy.useCount());
        ASSERT_EQ(2, owner.useCount());
    }

    ASSERT_EQ(1, copy.useCount());

    gc->collect();

    // 3 - gc + memInfo + Number pointed by TSObjectOwner
    EXPECT_EQ(3, memInfo->getAliveObjectsCount()->unboxed());

    copy = {};

    gc->collect();

    // 2 - gc + memInfo
    EXPECT_EQ(2, memInfo->getAliveObjectsCount()->unboxed());
}

} // namespace

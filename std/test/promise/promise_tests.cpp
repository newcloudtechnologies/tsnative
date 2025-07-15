#include <gtest/gtest.h>

#include "../infrastructure/global_test_allocator_fixture.h"
#include "../infrastructure/object_wrappers.h"
#include "../infrastructure/promise_wrapper.h"
#include "../mocks/mock_inline_executor.h"
#include "std/private/promise/promise_p.h"

class PromiseTest : public test::GlobalTestAllocatorFixture
{
public:
    test::MockInlineExecutor& getExecutor()
    {
        return _executor;
    }

    test::PromiseWrapper createPromise()
    {
        return test::PromiseWrapper{getExecutor()};
    }

    void SetUp() override
    {
        TestAllocator::Callbacks allocatorCallbacks;
        allocatorCallbacks.onAllocated = [this](void* o)
        {
            auto* obj = static_cast<test::Object*>(o);
            _allocated.push_back(obj);
        };
        _allocator = std::make_unique<TestAllocator>(std::move(allocatorCallbacks));

        ON_CALL(_executor, enqueue(::testing::_))
            .WillByDefault(testing::Invoke([](IExecutor::Callback&& callback) { callback(); }));
    }

    void TearDown() override
    {
        _allocator = nullptr;

        for (auto* o : _allocated)
        {
            delete o;
        }
        _allocated.clear();
    }

private:
    test::MockInlineExecutor _executor{};
    std::vector<test::Object*> _allocated{};
};

TEST_F(PromiseTest, checkEmptyStatesPromise)
{
    PromisePrivate promise;

    ASSERT_FALSE(promise.ready());
    ASSERT_FALSE(promise.isFulfilled());
    ASSERT_FALSE(promise.isRejected());
    ASSERT_FALSE(promise.getResult());
}

TEST_F(PromiseTest, checkResolvedPromise)
{
    PromisePrivate promise;

    auto resolved = new test::Number{0.f};
    promise.resolve(resolved);
    ASSERT_TRUE(promise.ready());
    ASSERT_TRUE(promise.isFulfilled());
    ASSERT_FALSE(promise.isRejected());
    ASSERT_TRUE(promise.getResult());
}

TEST_F(PromiseTest, checkSettingOneStateAlways)
{
    PromisePrivate promise;

    auto resolved = new test::Number{1.0f};

    promise.resolve(resolved);

    ASSERT_TRUE(promise.ready());
    ASSERT_TRUE(promise.isFulfilled());
    ASSERT_FALSE(promise.isRejected());

    promise.reject(resolved);

    ASSERT_TRUE(promise.ready());
    ASSERT_TRUE(promise.isFulfilled());
    ASSERT_FALSE(promise.isRejected());
}

TEST_F(PromiseTest, checkRejectedPromise)
{
    PromisePrivate promise;

    auto rejected = new test::Number{1.0f};
    promise.reject(rejected);
    ASSERT_TRUE(promise.ready());
    ASSERT_TRUE(promise.isRejected());
    ASSERT_FALSE(promise.isFulfilled());
}

TEST_F(PromiseTest, checkEquality)
{
    PromisePrivate promise1;
    auto promise2 = promise1;
    auto promise3 = promise2;

    EXPECT_EQ(promise1, promise2);
    EXPECT_EQ(promise1, promise3);
    EXPECT_EQ(promise2, promise3);
}

TEST_F(PromiseTest, checkNonEquality)
{
    PromisePrivate promise1;
    PromisePrivate promise2;

    EXPECT_NE(promise1, promise2);
}

TEST_F(PromiseTest, checkEmptyThen)
{
    auto p = createPromise();

    p.then();

    EXPECT_FALSE(p.ready());

    auto resolved = new test::Number{1.0f};
    p.resolve(resolved);
    EXPECT_TRUE(p.ready());
}

TEST_F(PromiseTest, checkThenOnlyFulfilled)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(1);

    auto p = createPromise();

    auto onFulfilled = [](test::Number** n) -> test::Number*
    {
        EXPECT_EQ((*n)->unboxed(), 1.0f);
        return *n;
    };

    p.then(std::move(onFulfilled));

    p.resolve(new test::Number{1.0f});

    EXPECT_TRUE(p.ready() && p.isFulfilled());
}

TEST_F(PromiseTest, checkThenAndIgnoreRejectReceiver)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(1);

    auto promise = createPromise();

    auto resolved = new test::Number{1.0f};

    promise.then(
        [](test::Number** n) -> test::Number*
        {
            EXPECT_EQ((*n)->unboxed(), 1.0f);
            throw *n;
        },
        [](test::Number** n) -> test::Number*
        {
            EXPECT_TRUE(false);
            return *n;
        });

    promise.resolve(resolved);

    EXPECT_TRUE(promise.ready() && promise.isFulfilled());
}

TEST_F(PromiseTest, checkThenAndIgnoreFulfilledReceiver)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(1);

    auto promise = createPromise();

    auto rejected = new test::Number{1.0f};

    promise.then(
        [](test::Number** n) -> test::Number*
        {
            EXPECT_TRUE(false);
            return *n;
        },
        [](test::Number** n) -> test::Number*
        {
            EXPECT_EQ((*n)->unboxed(), 1.0f);
            throw *n;
        });

    promise.reject(rejected);

    EXPECT_TRUE(promise.ready() && promise.isRejected());
}

TEST_F(PromiseTest, checkThenNoFatalIfThrow)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(1);

    auto promise = createPromise();

    auto resolved = new test::Number{1.0f};

    auto onFulfilled = [](test::Number** n) -> test::Number*
    {
        EXPECT_EQ((*n)->unboxed(), 1.0f);
        throw *n;
    };

    promise.then(std::move(onFulfilled));
    promise.resolve(resolved);

    EXPECT_TRUE(promise.ready() && promise.isFulfilled());
}

TEST_F(PromiseTest, checkFailMethod)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(1);

    auto promise = createPromise();

    auto rejected = new test::Number{1.0f};

    auto onRejected = [](test::Number** n) -> test::Number*
    {
        EXPECT_EQ((*n)->unboxed(), 1.0f);
        return *n;
    };

    promise.fail(std::move(onRejected));

    promise.reject(rejected);

    EXPECT_TRUE(promise.ready() && promise.isRejected());
}

TEST_F(PromiseTest, checkFinallyIfSetResolveValue)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(1);

    auto promise = createPromise();

    auto resolved = new test::Number{1.0f};

    auto onFinally = []
    {
        EXPECT_TRUE(true);
        return test::Undefined::instance();
    };

    promise.finally(std::move(onFinally));

    promise.resolve(resolved);

    EXPECT_TRUE(promise.ready() && promise.isFulfilled());
}

TEST_F(PromiseTest, checkFinallyIfSetRejectedValue)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(1);

    auto promise = createPromise();

    auto rejected = new test::Number{0.f};

    auto onFinally = []
    {
        EXPECT_TRUE(true);
        return test::Undefined::instance();
    };

    promise.finally(std::move(onFinally));

    promise.reject(rejected);

    EXPECT_TRUE(promise.ready() && promise.isRejected());
}

TEST_F(PromiseTest, checkAllFullChainsAndSetResolve)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(3);

    auto promise = createPromise();

    promise
        .then(
            [](test::Number** n)
            {
                EXPECT_EQ((*n)->unboxed(), 1.0f);
                return *n;
            },
            [](test::Number** n)
            {
                EXPECT_TRUE(false);
                return *n;
            })
        .finally([]() -> test::Object* { throw new String("FAIL"); })
        .fail(
            [](test::String** s)
            {
                EXPECT_EQ((*s)->cpp_str(), "FAIL");
                return *s;
            });

    promise.resolve(new test::Number{1.0f});
}

TEST_F(PromiseTest, checkAllFullChainsAndSetReject)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(3);

    auto promise = createPromise();

    promise
        .then(
            [](test::Number** n)
            {
                EXPECT_TRUE(false);
                return *n;
            },
            [](test::Number** n)
            {
                EXPECT_EQ((*n)->unboxed(), 1.0f);
                return *n;
            })
        .finally([]() -> test::Object* { throw new test::String("FAIL"); })
        .fail(
            [](test::String** s)
            {
                EXPECT_EQ((*s)->cpp_str(), "FAIL");
                return *s;
            });

    promise.reject(new test::Number{1.0f});
}

TEST_F(PromiseTest, checkHandlingLastException)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(3);

    auto promise = createPromise();

    promise
        .then([](test::Number** n) -> test::Number* { throw new test::String("FAIL-1"); })
        .finally([]() -> test::Object* { throw new test::String("FAIL-2"); })
        .fail(
            [](test::String** s) -> test::String*
            {
                EXPECT_EQ((*s)->cpp_str(), "FAIL-2");
                return *s;
            });

    promise.resolve(new test::Number{1.0f});
}

TEST_F(PromiseTest, checkHandlingLastExceptionAndIgnoreBeforeReceivers)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(4);

    auto promise = createPromise();

    promise
        .then([](test::Number** n) -> test::Number* { throw new test::String("FAIL-1"); })
        .finally([]() -> test::Object* { throw new test::String("FAIL-2"); })
        .then(
            [](test::Object** o) -> test::Object*
            {
                EXPECT_TRUE(false);
                return *o;
            })
        .fail(
            [](test::String** s)
            {
                EXPECT_EQ((*s)->cpp_str(), "FAIL-2");
                return *s;
            });

    promise.resolve(new test::Number{1.0f});
}

TEST_F(PromiseTest, checkIgnoreEmptyReceiversAndHandlingResultNoEmptyIfResolve)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(3);

    auto promise = createPromise();

    promise.then().finally().then(
        [](test::Number** n) -> test::Number*
        {
            EXPECT_EQ((*n)->unboxed(), 1.0f);
            return *n;
        });

    promise.resolve(new test::Number{1.0f});
}

TEST_F(PromiseTest, checkLastReceiverIsFinally)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(5);

    auto promise = createPromise();

    auto* value = new test::Number{1.0f};
    bool testFinallyFlag = false;

    promise
        .then(
            [](test::Number** n) -> test::Number*
            {
                EXPECT_EQ((*n)->unboxed(), 1.0f);
                auto* result = (*n)->addInplace(new test::Number{1.0f});
                return static_cast<test::Number*>(result);
            })
        .then(
            [](test::Number** n) -> test::Object*
            {
                EXPECT_EQ((*n)->unboxed(), 2.0f);
                throw *n;
            })
        .then(
            [](test::Number** n) -> test::Number*
            {
                EXPECT_TRUE(false);
                return *n;
            })
        .fail(
            [](test::Number** n) -> test::Number*
            {
                EXPECT_EQ((*n)->unboxed(), 2.0f);
                return *n;
            })
        .finally(
            [&testFinallyFlag]
            {
                testFinallyFlag = true;
                return test::Undefined::instance();
            });

    promise.resolve(value);
    EXPECT_TRUE(testFinallyFlag);
}

TEST_F(PromiseTest, checkIgnoreEmptyReceiversAndHandlingResultNoEmptyIfReject)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(3);

    auto promise = createPromise();

    promise.then().finally().then(
        [](test::Number** n) -> test::Number*
        {
            EXPECT_TRUE(false);
            return *n;
        },
        [](test::Number** n) -> test::Number*
        {
            EXPECT_EQ((*n)->unboxed(), 1.0f);
            return *n;
        });

    promise.reject(new test::Number{1.0f});
}

TEST_F(PromiseTest, checkIgnoreBeforeFulfilledAndHandlingCatch)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(6);

    auto promise = createPromise();

    promise.then()
        .finally()
        .then(
            [](test::Number** n) -> test::Number*
            {
                EXPECT_TRUE(false);
                return *n;
            })
        .then(
            [](test::Number** n) -> test::Number*
            {
                EXPECT_TRUE(false);
                return *n;
            })
        .finally([] { return test::Undefined::instance(); })
        .fail(
            [](test::Number** n)
            {
                EXPECT_EQ((*n)->unboxed(), 1.0f);
                return *n;
            });

    promise.reject(new test::Number{1.0f});
}

TEST_F(PromiseTest, checkIgnoreRestFulfilledAndHandlingCatch)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(6);

    auto promise = createPromise();

    promise
        .then(
            [](test::Number** n) -> test::Object*
            {
                EXPECT_EQ((*n)->unboxed(), 1.0f);
                throw new test::String{"FAIL"};
            })
        .finally()
        .then(
            [](test::Number** n) -> test::Number*
            {
                EXPECT_TRUE(false);
                return *n;
            })
        .then(
            [](test::Number** n) -> test::Number*
            {
                EXPECT_TRUE(false);
                return *n;
            })
        .finally([] { return test::Undefined::instance(); })
        .fail(
            [](test::String** s)
            {
                EXPECT_EQ((*s)->cpp_str(), "FAIL");
                return *s;
            });

    promise.resolve(new test::Number{1.0f});
}

TEST_F(PromiseTest, checkImmutableStatePromise)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(3);

    auto promise = createPromise();

    promise
        .then(
            [](test::Number** n) -> test::Object*
            {
                EXPECT_EQ((*n)->unboxed(), 1.0f);
                throw new test::String{"FAIL"};
            })
        .fail(
            [](test::String** s)
            {
                EXPECT_EQ((*s)->cpp_str(), "FAIL");
                return *s;
            })
        .fail(
            [](test::String** s)
            {
                EXPECT_TRUE(false);
                return *s;
            });

    promise.resolve(new test::Number{1.0f});
    promise.reject(new test::Number{2.0});

    EXPECT_TRUE(promise.isFulfilled());
}
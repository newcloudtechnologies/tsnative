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

#include <gtest/gtest.h>

#include "mock_inline_executor.h"
#include "promise_wrapper.h"
#include "std/private/promise/promise_p.h"
#include "std/tsnumber.h"
#include "std/tsstring.h"

class PromiseTest : public ::testing::Test
{
public:
    MockInlineExecutor& getExecutor()
    {
        return _executor;
    }

    Promise createPromise()
    {
        return Promise{getExecutor()};
    }

    void SetUp() override
    {
        ON_CALL(_executor, enqueue(::testing::_))
            .WillByDefault(testing::Invoke([](IExecutor::Callback&& callback) { callback(); }));
    }

private:
    MockInlineExecutor _executor{};
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

    auto resolved = new Number{0.f};
    promise.resolve(resolved);
    ASSERT_TRUE(promise.ready());
    ASSERT_TRUE(promise.isFulfilled());
    ASSERT_FALSE(promise.isRejected());
    ASSERT_TRUE(promise.getResult());
}

TEST_F(PromiseTest, checkSettingOneStateAlways)
{
    PromisePrivate promise;

    auto resolved = new Number{1.0f};

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

    auto rejected = new Number{1.0f};
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
    Promise p = createPromise();
    p.then();

    EXPECT_FALSE(p.ready());

    auto resolved = new Number{1.0f};
    p.resolve(resolved);
    EXPECT_TRUE(p.ready());
}

TEST_F(PromiseTest, checkThenOnlyFulfilled)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(1);

    Promise p = createPromise();

    auto onFulfilled = [](Number* n) -> Number*
    {
        EXPECT_EQ(n->unboxed(), 1.0f);
        return n;
    };

    p.then(std::move(onFulfilled));

    p.resolve(new Number{1.0f});

    EXPECT_TRUE(p.ready() && p.isFulfilled());
}

TEST_F(PromiseTest, checkThenAndIgnoreRejectReceiver)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(1);

    Promise promise = createPromise();

    auto resolved = new Number{1.0f};

    promise.then(
        [](Number* n) -> Number*
        {
            EXPECT_EQ(n->unboxed(), 1.0f);
            throw Undefined::instance();
        },
        [](Number* n) -> Number*
        {
            EXPECT_TRUE(false);
            return n;
        });

    promise.resolve(resolved);

    EXPECT_TRUE(promise.ready() && promise.isFulfilled());
}

TEST_F(PromiseTest, checkThenAndIgnoreFulfilledReceiver)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(1);

    Promise promise = createPromise();

    auto rejected = new Number{1.0f};

    promise.then(
        [](Number* n) -> Number*
        {
            EXPECT_TRUE(false);
            return n;
        },
        [](Number* n) -> Number*
        {
            EXPECT_EQ(n->unboxed(), 1.0f);
            throw Undefined::instance();
        });

    promise.reject(rejected);

    EXPECT_TRUE(promise.ready() && promise.isRejected());
}

TEST_F(PromiseTest, checkThenNoFatalIfThrow)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(1);

    Promise promise = createPromise();

    auto resolved = new Number{1.0f};

    auto onFulfilled = [](Number* n) -> Number*
    {
        EXPECT_EQ(n->unboxed(), 1.0f);
        throw Undefined::instance();
    };

    promise.then(std::move(onFulfilled));
    promise.resolve(resolved);

    EXPECT_TRUE(promise.ready() && promise.isFulfilled());
}

TEST_F(PromiseTest, checkFailMethod)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(1);

    Promise promise = createPromise();

    auto rejected = new Number{1.0f};

    auto onRejected = [](Number* n) -> Number*
    {
        EXPECT_EQ(n->unboxed(), 1.0f);
        return n;
    };

    promise.fail(std::move(onRejected));

    promise.reject(rejected);

    EXPECT_TRUE(promise.ready() && promise.isRejected());
}

TEST_F(PromiseTest, checkFinallyIfSetResolveValue)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(1);

    Promise promise = createPromise();

    auto resolved = new Number{1.0f};

    auto onFinally = []() -> Object*
    {
        EXPECT_TRUE(true);
        return Undefined::instance();
    };

    promise.finally(std::move(onFinally));

    promise.resolve(resolved);

    EXPECT_TRUE(promise.ready() && promise.isFulfilled());
}

TEST_F(PromiseTest, checkFinallyIfSetRejectedValue)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(1);

    Promise promise = createPromise();

    auto rejected = new Number{0.f};

    auto onFinally = []() -> Object*
    {
        EXPECT_TRUE(true);
        return Undefined::instance();
    };

    promise.finally(std::move(onFinally));

    promise.reject(rejected);

    EXPECT_TRUE(promise.ready() && promise.isRejected());
}

TEST_F(PromiseTest, checkAllFullChainsAndSetResolve)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(3);

    Promise promise = createPromise();

    promise
        .then(
            [](Number* n)
            {
                EXPECT_EQ(n->unboxed(), 1.0f);
                return n;
            },
            [](Number* n)
            {
                EXPECT_TRUE(false);
                return n;
            })
        .finally([]() -> Object* { throw new String("FAIL"); })
        .fail(
            [](String* s)
            {
                EXPECT_EQ(s->cpp_str(), "FAIL");
                return Undefined::instance();
            });

    promise.resolve(new Number{1.0f});
}

TEST_F(PromiseTest, checkAllFullChainsAndSetReject)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(3);

    Promise promise = createPromise();

    promise
        .then(
            [](Number* n)
            {
                EXPECT_TRUE(false);
                return n;
            },
            [](Number* n)
            {
                EXPECT_EQ(n->unboxed(), 1.0f);
                return n;
            })
        .finally([]() -> Object* { throw new String("FAIL"); })
        .fail(
            [](String* s)
            {
                EXPECT_EQ(s->cpp_str(), "FAIL");
                return Undefined::instance();
            });

    promise.reject(new Number{1.0f});
}

TEST_F(PromiseTest, checkHandlingLastException)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(3);

    Promise promise = createPromise();

    promise
        .then([](Number* n) -> Number* { throw new String("FAIL-1"); })
        .finally([]() -> Object* { throw new String("FAIL-2"); })
        .fail(
            [](String* s)
            {
                EXPECT_EQ(s->cpp_str(), "FAIL-2");
                return Undefined::instance();
            });

    promise.resolve(new Number{1.0f});
}

TEST_F(PromiseTest, checkHandlingLastExceptionAndIgnoreBeforeReceivers)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(4);

    Promise promise = createPromise();

    promise
        .then([](Number* n) -> Number* { throw new String("FAIL-1"); })
        .finally([]() -> Object* { throw new String("FAIL-2"); })
        .then(
            [](Object*) -> Object*
            {
                EXPECT_TRUE(false);
                return Undefined::instance();
            })
        .fail(
            [](String* s)
            {
                EXPECT_EQ(s->cpp_str(), "FAIL-2");
                return Undefined::instance();
            });

    promise.resolve(new Number{1.0f});
}

TEST_F(PromiseTest, checkIgnoreEmptyReceiversAndHandlingResultNoEmptyIfResolve)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(3);

    Promise promise = createPromise();

    promise.then().finally().then(
        [](Number* n) -> Object*
        {
            EXPECT_EQ(n->unboxed(), 1.0f);
            return Undefined::instance();
        });

    promise.resolve(new Number{1.0f});
}

TEST_F(PromiseTest, checkLastReceiverIsFinally)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(5);

    Promise promise = createPromise();

    auto* value = new Number{1.0f};

    promise
        .then(
            [](Number* n) -> Number*
            {
                EXPECT_EQ(n->unboxed(), 1.0f);
                return n->addInplace(new Number{1.0f});
            })
        .then(
            [](Number* n) -> Object*
            {
                EXPECT_EQ(n->unboxed(), 2.0f);
                throw n;
            })
        .then(
            [](Number* n) -> Object*
            {
                EXPECT_TRUE(false);
                return Undefined::instance();
            })
        .fail(
            [](Number* n)
            {
                EXPECT_EQ(n->unboxed(), 2.0f);
                return Undefined::instance();
            })
        .finally(
            [value]
            {
                EXPECT_EQ(value->unboxed(), 2.0f);
                return Undefined::instance();
            });

    promise.resolve(value);
}

TEST_F(PromiseTest, checkIgnoreEmptyReceiversAndHandlingResultNoEmptyIfReject)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(3);

    Promise promise = createPromise();

    promise.then().finally().then(
        [](Number* n) -> Object*
        {
            EXPECT_TRUE(false);
            return Undefined::instance();
        },
        [](Number* n)
        {
            EXPECT_EQ(n->unboxed(), 1.0f);
            return Undefined::instance();
        });

    promise.reject(new Number{1.0f});
}

TEST_F(PromiseTest, checkIgnoreBeforeFulfilledAndHandlingCatch)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(6);

    Promise promise = createPromise();

    promise.then()
        .finally()
        .then(
            [](Number* n) -> Object*
            {
                EXPECT_TRUE(false);
                return Undefined::instance();
            })
        .then(
            [](Number* n) -> Object*
            {
                EXPECT_TRUE(false);
                return Undefined::instance();
            })
        .finally([] { return Undefined::instance(); })
        .fail(
            [](Number* n)
            {
                EXPECT_EQ(n->unboxed(), 1.0f);
                return n;
            });

    promise.reject(new Number{1.0f});
}

TEST_F(PromiseTest, checkIgnoreRestFulfilledAndHandlingCatch)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(6);

    Promise promise = createPromise();

    promise
        .then(
            [](Number* n) -> Object*
            {
                EXPECT_EQ(n->unboxed(), 1.0f);
                throw new String{"FAIL"};
            })
        .finally()
        .then(
            [](Number* n) -> Object*
            {
                EXPECT_TRUE(false);
                return Undefined::instance();
            })
        .then(
            [](Number* n) -> Object*
            {
                EXPECT_TRUE(false);
                return Undefined::instance();
            })
        .finally([] { return Undefined::instance(); })
        .fail(
            [](String* s)
            {
                EXPECT_EQ(s->cpp_str(), "FAIL");
                return s;
            });

    promise.resolve(new Number{1.0f});
}

TEST_F(PromiseTest, checkImmutableStatePromise)
{
    EXPECT_CALL(getExecutor(), enqueue(::testing::_)).Times(3);

    Promise promise = createPromise();

    promise
        .then(
            [](Number* n) -> Object*
            {
                EXPECT_EQ(n->unboxed(), 1.0f);
                throw new String{"FAIL"};
            })
        .fail(
            [](String* s)
            {
                EXPECT_EQ(s->cpp_str(), "FAIL");
                return s;
            })
        .fail(
            [](String* s)
            {
                EXPECT_TRUE(false);
                return s;
            });

    promise.resolve(new Number{1.0f});
    promise.reject(new Number{2.0});

    EXPECT_TRUE(promise.isFulfilled());
}
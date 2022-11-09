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

#include "std/private/promise/general_finite_state_machine.h"

//  ----------------- *
//  |   start         |
//  |     |           |
//  *---> A --> B --> C
//      __|           ^
//      |             |
//      *-> D --------*

// States
struct A
{
};
struct B
{
};
struct C
{
};
struct D
{
};

// Events
struct ABEvent
{
};
struct ADEvent
{
};
struct BCEvent
{
};
struct CAEvent
{
};
struct DCEvent
{
};

class StateMachine : public GeneralFiniteStateMachine<StateMachine, A, B, C, D>
{
public:
    template <typename S, typename E>
    auto on(const S&, const E&)
    {
        return absl::nullopt;
    }

    StateMachine::State on(const A&, const ABEvent&)
    {
        return B{};
    }

    StateMachine::State on(const A&, const ADEvent&)
    {
        return D{};
    }

    StateMachine::State on(const B&, const BCEvent&)
    {
        return C{};
    }

    StateMachine::State on(const C&, const CAEvent&)
    {
        return A{};
    }

    StateMachine::State on(const D&, const DCEvent&)
    {
        return C{};
    }
};

TEST(GeneralFiniteStateMachine, checkInstance)
{
    StateMachine stateMachine;
    EXPECT_TRUE(stateMachine.hasCurrentState<A>());
}

TEST(GeneralFiniteStateMachine, checkABTransition)
{
    StateMachine stateMachine;
    stateMachine.dispatch(ABEvent{});
    EXPECT_TRUE(stateMachine.hasCurrentState<B>());

    stateMachine.dispatch(ADEvent{});
    EXPECT_FALSE(stateMachine.hasCurrentState<D>());
}

TEST(GeneralFiniteStateMachine, checkADTransition)
{
    StateMachine stateMachine;
    stateMachine.dispatch(ADEvent{});
    EXPECT_TRUE(stateMachine.hasCurrentState<D>());

    stateMachine.dispatch(CAEvent{});
    EXPECT_FALSE(stateMachine.hasCurrentState<A>());
}

TEST(GeneralFiniteStateMachine, checkBCTransition)
{
    StateMachine stateMachine;
    stateMachine.dispatch(ABEvent{});
    EXPECT_TRUE(stateMachine.hasCurrentState<B>());
    stateMachine.dispatch(BCEvent{});
    EXPECT_TRUE(stateMachine.hasCurrentState<C>());

    stateMachine.dispatch(ADEvent{});
    EXPECT_FALSE(stateMachine.hasCurrentState<D>());
}

TEST(GeneralFiniteStateMachine, checkCATransition)
{
    StateMachine stateMachine;
    stateMachine.dispatch(ABEvent{});
    stateMachine.dispatch(BCEvent{});
    stateMachine.dispatch(CAEvent{});
    EXPECT_TRUE(stateMachine.hasCurrentState<A>());

    stateMachine.dispatch(DCEvent{});
    EXPECT_FALSE(stateMachine.hasCurrentState<C>());
}

TEST(GeneralFiniteStateMachine, checkDCTransition)
{
    StateMachine stateMachine;
    stateMachine.dispatch(ADEvent{});
    stateMachine.dispatch(DCEvent{});
    EXPECT_TRUE(stateMachine.hasCurrentState<C>());

    stateMachine.dispatch(ADEvent{});
    EXPECT_FALSE(stateMachine.hasCurrentState<D>());
}

TEST(GeneralFiniteStateMachine, checkACTransitionLoop)
{
    StateMachine stateMachine;
    stateMachine.dispatch(ADEvent{});
    stateMachine.dispatch(DCEvent{});
    stateMachine.dispatch(CAEvent{});
    EXPECT_TRUE(stateMachine.hasCurrentState<A>());

    stateMachine.dispatch(ADEvent{});
    EXPECT_TRUE(stateMachine.hasCurrentState<D>());
}
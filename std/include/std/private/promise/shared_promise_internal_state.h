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

#pragma once

#include "promise_state.h"
#include "std/private/emitter.h"
#include "std/private/promise/promise_callback.h"

class PromisePrivate;
class Object;
class IExecutor;

class SharedPromiseInternalState final : public PromiseEmitter<SharedPromiseInternalState>
{
public:
    using States = PromiseState::States;

    void attach(PromisePrivate next, Object* onFulfilled, Object* onRejected, IExecutor& executor);

    bool resolve(Result&& resolved);

    bool reject(Result&& resolved);

    bool ready() const;

    bool isFulfilled() const;

    bool isRejected() const;

    Object* getResult() const;

private:
    PromiseState _state{};
    absl::optional<Result> _result{};
};

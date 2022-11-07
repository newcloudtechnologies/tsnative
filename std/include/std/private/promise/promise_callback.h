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

#include "promise_p.h"
#include "std/private/emitter.h"
#include "std/private/promise/expected.h"

class Object;
class TSClosure;

struct SuccessEvent final
{
    Object* data;
};

struct ErrorEvent final
{
    Object* data;
};

using Result = Expected<Object*, Object*>;

class PromiseCallback final : public EmitterBase<PromiseCallback, SuccessEvent, ErrorEvent>
{
public:
    PromiseCallback(Object* onFulfilled, Object* onRejected, PromisePrivate nextPromise);

private:
    void invoke(Object* object, Result&& arg) noexcept;

    void callClosure(TSClosure* closure, Result&& arg) noexcept;

    void transferResult(Result&& arg) noexcept;

private:
    Object* _onFulfilled{nullptr};
    Object* _onRejected{nullptr};
    PromisePrivate _nextPromise;
};

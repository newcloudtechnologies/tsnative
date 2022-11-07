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

#include <memory>

class SharedPromiseInternalState;

class Object;

class IExecutor;

class PromisePrivate final
{
public:
    PromisePrivate();

    PromisePrivate& operator=(const PromisePrivate&) = delete;

    PromisePrivate then(Object* onResolved, Object* onRejected, IExecutor& executor);

    void resolve(Object* resolved);

    void reject(Object* rejected);

    bool ready() const;

    bool isFulfilled() const;

    bool isRejected() const;

    bool operator==(const PromisePrivate& other) const;

    bool operator!=(const PromisePrivate& other) const;

    Object* getResult() const;

private:
    std::shared_ptr<SharedPromiseInternalState> _internalState;
};

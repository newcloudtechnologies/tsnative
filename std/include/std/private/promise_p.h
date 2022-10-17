#pragma once

#include <memory>

class InternalState;

class Object;

class PromisePrivate final
{
public:
    PromisePrivate();

    PromisePrivate(const PromisePrivate& other);

    PromisePrivate& operator=(const PromisePrivate&) = delete;

    PromisePrivate then(Object* onResolved, Object* onRejected);

    PromisePrivate then(Object* onResolved);

    PromisePrivate then();

    PromisePrivate fail(Object* onRejected);

    PromisePrivate finally(Object* onFinally);

    void resolve(Object* resolved);

    void reject(Object* rejected);

    bool ready() const;

    bool isFulfilled() const;

    bool isRejected() const;

private:
    std::shared_ptr<InternalState> _internalState;
};

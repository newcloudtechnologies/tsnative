#pragma once

#include "std/tsobject.h"

class InternalState;

class Object;

class Promise final
{
public:
    Promise();

    Promise(const Promise & other);

    Promise & operator = (const Promise &) = delete;

    Promise then(Object* onResolved, Object* onRejected);

    Promise then(Object* onResolved);

    Promise then();

    Promise fail(Object* onRejected);

    void resolve(Object * resolved);

    void reject(Object * rejected);

    Promise finally(Object * onFinally);

    bool ready() const;

    bool isFulfilled() const;

    bool isRejected() const;

private:
    std::shared_ptr<InternalState> _internalState;
};

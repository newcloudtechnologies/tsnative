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

    void resolve(Object* resolved);

    void reject(Object* rejected);

    bool ready() const;

    bool isFulfilled() const;

    bool isRejected() const;

    friend bool operator == (const PromisePrivate & lhs, const PromisePrivate & rhs);

private:
    std::shared_ptr<InternalState> _internalState;
};

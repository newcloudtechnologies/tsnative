#pragma once

#include "std/private/promise/promise_emitter.h"

#include <memory>

class SharedPromiseInternalState;

class Object;

class Promise;

class IExecutor;

class PromisePrivate final
{
public:
    class Connector : public PromiseEmitter<Connector>
    {
    public:
        explicit Connector(std::weak_ptr<SharedPromiseInternalState> weakInternalState);

    private:
        std::weak_ptr<SharedPromiseInternalState> _weakInternalState;
    };

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

    std::weak_ptr<Connector> getReadyConnector() const;

private:
    void joinPromise(Promise* tsPromise);
    void transferResult(Promise* readyPromise);

private:
    std::shared_ptr<SharedPromiseInternalState> _internalState;
    std::shared_ptr<Connector> _connector;
};

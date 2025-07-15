#pragma once

#include <TS.h>

#include "std/id_generator.h"
#include "std/tsobject.h"
#include "std/tsobject_owner.h"

#include "std/private/promise/promise_emitter.h"

#include <memory>
#include <vector>

class String;
class Boolean;
class Union;
class TSClosure;

class PromisePrivate;
class ToStringConverter;

class TS_DECLARE Promise : public Object, public EmitterBase<Promise, ReadyEvent>
{
protected:
    explicit Promise(PromisePrivate* promisePrivate, std::vector<Object*>&& childs);

    Promise(const Promise& other) = delete;
    Promise& operator=(const Promise& other) = delete;
    Promise(Promise&& other) = delete;
    Promise& operator=(const Promise&& other) = delete;

    ~Promise() override;

public:
    TS_METHOD TS_SIGNATURE("resolve(resolved?: Object): Promise") static Promise* resolve(Union* resolved);

    TS_METHOD TS_SIGNATURE("reject(rejected: Object): Promise") static Promise* reject(Object* resolved);

    TS_CODE("constructor(executor: (resolve: (value?: any) => void, reject: (reason?: any) => void) => void);")
    explicit Promise(TSClosure* executor);

    TS_METHOD TS_SIGNATURE("then(onfulfilled?: (value: any) => void, onrejected?: (reason?: any) => void): Promise")
        Promise* then(Union* onFulfilled, Union* onRejected);

    TS_METHOD TS_NAME("catch") TS_DECORATOR("MapsTo('catchException')")
        TS_SIGNATURE("catch(onrejected?: (reason?: any) => void): Promise") Promise* catchException(Union* onRejected);

    TS_CODE("finally(onFinally?: () => void): Promise;");
    Promise* finally(Union* onFinally);

    Object* getResult() const;

    bool ready() const;

    bool isFulfilled() const;

    bool isRejected() const;

    ID getID() const;

    TS_METHOD Boolean* equals(Object* other) const override;

    TS_METHOD String* toString() const override;

    TS_METHOD Boolean* toBool() const override;

    std::vector<Object*> getChildObjects() const override;

private:
    void success(Object* resolved);

    void failure(Object* rejected);

    TSClosure* makeResolveClosure();

    TSClosure* makeRejectClosure();

    void removeKeeperAlive();

private:
    PromisePrivate* _d;
    ID _promiseID;
    std::vector<Object*> _children;

    void** _pseudoRoot = nullptr;

private:
    friend class ToStringConverter;
};

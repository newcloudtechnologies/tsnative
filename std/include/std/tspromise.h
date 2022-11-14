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

#include <TS.h>

#include "std/tsobject.h"

#include "std/private/promise/promise_emitter.h"

#include <memory>

class String;
class Boolean;
class Union;
class TSClosure;

class PromisePrivate;

class TS_DECLARE Promise : public Object, public EmitterBase<Promise, ReadyEvent>
{
protected:
    explicit Promise(PromisePrivate* promisePrivate);

public:
    TS_METHOD TS_SIGNATURE("resolve(resolved?: Object): Promise") static Promise* resolve(Union* resolved);

    TS_METHOD TS_SIGNATURE("reject(rejected: Object): Promise") static Promise* reject(Object* resolved);

    TS_CODE("constructor(executor: (resolve: (value?: any) => void, reject: (reason?: any) => void) => void);")
    explicit Promise(TSClosure* executor);

    ~Promise() override;

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

    TS_METHOD Boolean* equals(Object* other) const override;

    TS_METHOD String* toString() const override;

    TS_METHOD Boolean* toBool() const override;

private:
    void success(Object* resolved);

    void failure(Object* rejected);

private:
    PromisePrivate* _d;
};

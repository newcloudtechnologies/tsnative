#pragma once

#include <TS.h>
#include "std/tsobject.h"

#include <memory>

class String;
class Boolean;
class Union;
class TSClosure;

class PromisePrivate;

TS_CODE("import { TSClosure } from './tsclosure' \n");

class TS_DECLARE Promise : public Object
{
protected:
    Promise(std::unique_ptr<PromisePrivate> promisePrivate);
public:
    TS_METHOD TS_SIGNATURE("resolve(resolved?: Object): Promise") static Promise * resolve(Union * resolved);

    TS_METHOD TS_SIGNATURE("reject(rejected?: Object): Promise") static Promise * reject(Union * resolved);

    TS_METHOD explicit Promise(TSClosure * executor);

    ~Promise() override;

    TS_METHOD TS_SIGNATURE("then(onfulfilled?: TSClosure, onrejected?: TSClosure): Promise") Promise* then(
        Union* onFulfilled, Union* onRejected);

    TS_METHOD TS_NAME("catch") TS_DECORATOR("MapsTo('fail')")
    TS_SIGNATURE("catch(onrejected?: TSClosure): Promise") Promise* fail(Union* onRejected);

    TS_METHOD TS_SIGNATURE("finally(onFinally?: TSClosure): Promise") Promise* finally(Union* onFinally);

    TS_METHOD Boolean* equals(Object* other) const override;

    TS_METHOD String* toString() const override;

    TS_METHOD Boolean* toBool() const override;

private:
    TS_METHOD TS_SIGNATURE("success(resolved: Object): void") void success(Object * resolved);

    TS_METHOD TS_SIGNATURE("failure(rejected: Object): void") void failure(Object * rejected);

private:
    std::unique_ptr<PromisePrivate> _d;
};

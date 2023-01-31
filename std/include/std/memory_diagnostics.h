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

#include <memory>

class Number;
class MemoryDiagnosticsStorage;
class IGCImpl;

class TS_EXPORT TS_DECLARE MemoryDiagnostics : public Object
{
public:
    MemoryDiagnostics(const MemoryDiagnosticsStorage& storage, const IGCImpl& gc);

    TS_METHOD Number* getAliveObjectsCount() const;
    TS_METHOD Number* getDeletedObjectsCount() const;

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

    TS_METHOD void printGCState() const;

private:
    const MemoryDiagnosticsStorage& _storage;
    const IGCImpl& _gc;
};

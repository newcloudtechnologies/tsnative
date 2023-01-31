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

TS_CODE("import { MemoryDiagnostics } from './memory_diagnostics' \n");

class MemoryDiagnostics;
class MemoryDiagnosticsStorage;
class IGCImpl;

class TS_EXPORT TS_DECLARE Diagnostics : public Object
{
public:
    Diagnostics(const IGCImpl& gcImpl, const MemoryDiagnosticsStorage& memoryDiagnosticsStorage);

    TS_METHOD MemoryDiagnostics* getMemoryDiagnostics() const;

    TS_METHOD String* toString() const override;
    TS_METHOD Boolean* toBool() const override;

private:
    const IGCImpl& _gcImpl;
    const MemoryDiagnosticsStorage& _memoryDiagnosticsStorage;
};

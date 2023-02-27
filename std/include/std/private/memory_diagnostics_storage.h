/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <cstddef>

class Object;

class MemoryDiagnosticsStorage final
{
public:
    std::size_t getDeletedObjectsCount() const;

    void onDeleted(const void*);

private:
    std::size_t _deletedObjectsCount = 0u;
};

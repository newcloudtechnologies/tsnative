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

#include <utility>
#include <vector>

class Object;
class String;

class GCVariableNames final
{
public:
    void setRootName(Object** root, const String* associatedVariable);

    void unsetRootName(Object** root);

    const String* getAssociatedVariableWithHeap(const Object* object) const;

private:
    struct Entry final
    {
        Object** root{nullptr};
        const String* associatedVariableName{nullptr};
    };

    std::vector<Entry> _associatedVariables{};
};
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

#include <string>
#include <utility>
#include <vector>

class Object;
class String;

class GCNamesStorage final
{
public:
    struct Entry final
    {
        Object** root{nullptr};
        std::string variableName;
        std::string scopeName;
    };

    // Object {__variable_name__: StringObject, __scope_name__: StringObject}
    void setRootName(Object** root, const Object* associatedVariable);

    void setCppRootName(Object** root, const std::string& name);

    void unsetRootName(Object** root);

    // use std::optional when c++ standard >= 17
    Entry getObjectEntryWithHeap(const Object* object) const;

private:
    std::vector<Entry> _associatedVariablesAndScopes{};
};
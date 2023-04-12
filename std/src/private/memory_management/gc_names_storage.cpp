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

#include "std/private/memory_management/gc_names_storage.h"
#include "std/private/to_string_converter.h"
#include "std/tsstring.h"

#include <algorithm>
#include <cassert>

void GCNamesStorage::setRootName(Object** root, const Object* associatedVariable)
{
    if (!associatedVariable || !root || !(*root))
    {
        return;
    }

    Entry entry;
    entry.valid = true;

    String varNameKey("__variable_name__");
    const auto* variableName = associatedVariable->get(&varNameKey);
    if (variableName)
    {
        entry.variableName = ToStringConverter::convert(variableName);
    }

    String scopeNameKey("__scope_name__");
    const auto* scopeName = associatedVariable->get(&scopeNameKey);
    if (scopeName)
    {
        entry.scopeName = ToStringConverter::convert(scopeName);
    }

    _associatedVariablesAndScopes[*root] = entry;
}

void GCNamesStorage::unsetRootName(Object** root)
{
    if (!root || !(*root))
    {
        return;
    }

    auto found = _associatedVariablesAndScopes.find(*root);

    if (found != _associatedVariablesAndScopes.cend())
    {
        _associatedVariablesAndScopes.erase(found);
    }
}

void GCNamesStorage::setCppRootName(Object** root, const std::string& rootName)
{
    if (!root || !(*root))
    {
        return;
    }

    Entry entry;
    entry.variableName = rootName;
    entry.valid = true;

    _associatedVariablesAndScopes[*root] = entry;
}

GCNamesStorage::Entry GCNamesStorage::getObjectEntryWithHeap(const Object* object) const
{
    if (!object)
    {
        return {};
    }

    const auto found = _associatedVariablesAndScopes.find(object);
    if (found == _associatedVariablesAndScopes.cend())
    {
        return {};
    }

    return found->second;
}
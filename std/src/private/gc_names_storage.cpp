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

#include "std/private/gc_names_storage.h"
#include "std/private/gc_string_converter.h"
#include "std/tsstring.h"

#include <algorithm>
#include <cassert>

namespace
{
constexpr auto g_VariableNameKey = "__variable_name__";
constexpr auto g_ScopeNameKey = "__scope_name__";
} // namespace

void GCNamesStorage::setRootName(Object** root, const Object* associatedVariable)
{
    Entry entry;
    entry.root = root;

    if (associatedVariable)
    {
        const String* variableName = associatedVariable->get<String*>(g_VariableNameKey);
        if (variableName)
        {
            entry.variableName = GCStringConverter::convert(variableName);
        }
        const String* scopeName = associatedVariable->get<String*>(g_ScopeNameKey);
        if (scopeName)
        {
            entry.scopeName = GCStringConverter::convert(scopeName);
        }
    }
    _associatedVariablesAndScopes.push_back(entry);
}

void GCNamesStorage::unsetRootName(Object** root)
{
    auto found = std::find_if(_associatedVariablesAndScopes.cbegin(),
                              _associatedVariablesAndScopes.cend(),
                              [root](const auto& p) { return p.root == root; });
    if (found != _associatedVariablesAndScopes.cend())
    {
        _associatedVariablesAndScopes.erase(found);
    }
}

void GCNamesStorage::setCppRootName(Object** root, const std::string& rootName)
{
    Entry entry;
    entry.root = root;
    entry.variableName = rootName;
    _associatedVariablesAndScopes.push_back(entry);
}

GCNamesStorage::Entry GCNamesStorage::getObjectEntryWithHeap(const Object* object) const
{
    const auto found = std::find_if(_associatedVariablesAndScopes.cbegin(),
                                    _associatedVariablesAndScopes.cend(),
                                    [object](const auto& p)
                                    {
                                        if (!p.root && !(*p.root))
                                        {
                                            return false;
                                        }
                                        return *(p.root) == object;
                                    });
    if (found == _associatedVariablesAndScopes.cend())
    {
        return {};
    }
    return *found;
}
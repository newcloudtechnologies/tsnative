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

#include "std/private/gc_variable_names.h"
#include "std/tsstring.h"

#include <algorithm>
#include <cassert>

void GCVariableNames::setRootName(Object** root, const Object* associatedVariable)
{
    _associatedVariablesAndScopes.push_back({root, associatedVariable});
}

void GCVariableNames::unsetRootName(Object** root)
{
    auto found = std::find_if(_associatedVariablesAndScopes.cbegin(),
                              _associatedVariablesAndScopes.cend(),
                              [root](const auto& p) { return p.root == root; });
    if (found != _associatedVariablesAndScopes.cend())
    {
        _associatedVariablesAndScopes.erase(found);
    }
}

const String* GCVariableNames::getAssociatedVariableWithHeap(const Object* entry) const
{
    if (entry == nullptr)
    {
        return nullptr;
    }
    const String* variableName = entry->get<String*>("__variable_name__");
    return variableName;
}

const String* GCVariableNames::getAssociatedScopeWithHeap(const Object* entry) const
{
    if (entry == nullptr)
    {
        return nullptr;
    }
    const String* scopeName = entry->get<String*>("__scope_name__");
    return scopeName;
}

const Object* GCVariableNames::getObjectEntryWithHeap(const Object* object) const
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
        return nullptr;
    }
    return found->associatedVariableAndScopeName;
}
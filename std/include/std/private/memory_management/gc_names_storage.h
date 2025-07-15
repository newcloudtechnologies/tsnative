#pragma once

#include <string>
#include <unordered_map>
#include <utility>

class Object;
class String;

class GCNamesStorage final
{
public:
    struct Entry final
    {
        std::string variableName;
        std::string scopeName;

        bool valid = false;
    };

    // Object {__variable_name__: StringObject, __scope_name__: StringObject}
    void setRootName(Object** root, const Object* associatedVariable);

    void setCppRootName(Object** root, const std::string& name);

    void unsetRootName(Object** root);

    // use std::optional when c++ standard >= 17
    Entry getObjectEntryWithHeap(const Object* object) const;

private:
    std::unordered_map<const Object*, Entry> _associatedVariablesAndScopes{};
};
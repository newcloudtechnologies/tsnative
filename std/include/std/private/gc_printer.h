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

#include "std/private/gc_names_storage.h"

#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

class Object;
class String;

namespace gvl
{
class Graph;
class NodeId;
} // namespace gvl

class GCPrinter
{
public:
    using roots_t = std::unordered_set<Object**>;
    using objects_t = std::unordered_set<Object*>;

    GCPrinter(const objects_t& heap, const roots_t& roots, const GCNamesStorage& variables);

    void print() const;

private:
    void fillRootsGraph(gvl::Graph& graph, const roots_t& roots) const;
    std::string formatHeapInfo(const objects_t& heap) const;

    using visited_nodes_t = std::unordered_map<Object*, gvl::NodeId>;

    void fillChildrenGraph(gvl::Graph& graph,
                           const gvl::NodeId& parentNode,
                           Object* object,
                           visited_nodes_t& visited) const;

    std::string formatObjInfo(const Object* obj) const;

    std::string formatVariableNames(const Object* object) const;

private:
    const objects_t& _heap;
    const roots_t& _roots;
    const GCNamesStorage& _variables;
};
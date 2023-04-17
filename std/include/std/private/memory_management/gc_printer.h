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

#include "std/private/memory_management/gc_names_storage.h"
#include "std/private/memory_management/gc_types.h"

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
    GCPrinter(const UniqueObjects& heap,
              const Roots& roots,
              const GCNamesStorage& variables,
              const UniqueConstObjects& marked);

    void print(std::string fileName = "") const;

private:
    void fillRootsGraph(gvl::Graph& graph, const Roots& roots) const;
    std::string formatHeapInfo(const UniqueObjects& heap) const;

    using visited_nodes_t = std::unordered_map<Object*, gvl::NodeId>;

    void fillChildrenGraph(gvl::Graph& graph,
                           const gvl::NodeId& parentNode,
                           Object* object,
                           visited_nodes_t& visited) const;

    std::string formatObjInfo(const Object* obj) const;

    std::string formatVariableNames(const Object* object) const;

private:
    const UniqueObjects& _heap;
    const Roots& _roots;
    const GCNamesStorage& _variables;
    const UniqueConstObjects& _marked;
};
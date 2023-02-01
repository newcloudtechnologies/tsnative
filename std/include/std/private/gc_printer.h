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
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

class Object;

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

    void print(const objects_t& heap, const roots_t& roots);

private:
    static void fillRootsGraph(gvl::Graph& graph, const roots_t& roots);
    static std::string formatHeapInfo(const objects_t& heap);

    using visited_nodes_t = std::unordered_map<Object*, gvl::NodeId>;

    static void fillChildrenGraph(gvl::Graph& graph,
                                  const gvl::NodeId& parentNode,
                                  Object* object,
                                  visited_nodes_t& visited);
};
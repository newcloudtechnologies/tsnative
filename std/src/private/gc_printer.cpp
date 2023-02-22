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

#include "std/private/gc_printer.h"

#include "std/private/gc_string_converter.h"
#include "std/tsobject.h"
#include "std/tsstring.h"

#include <algorithm>
#include <fstream>
#include <iostream>
#include <sstream>

#include <include/gvl.h>

GCPrinter::GCPrinter(const GCPrinter::objects_t& heap, const GCPrinter::roots_t& roots, const GCNamesStorage& variables)
    : _heap(heap)
    , _roots(roots)
    , _variables(variables)
{
}

void GCPrinter::print() const
{
    static int i = 0;

    gvl::Graph graph("Roots");
    graph.AddGraphProperty("rankdir", "LR");
    graph.AddCommonNodeProperty("shape", "box");

    graph.AddNode(formatHeapInfo(_heap), {gvl::Property("color", "red")});

    fillRootsGraph(graph, _roots);

    std::ofstream out("gc_print_" + std::to_string(i++) + ".gv");
    graph.RenderDot(out);
}

std::string GCPrinter::formatHeapInfo(const objects_t& heap) const
{
    std::stringstream ss;
    ss << "===== Heap =====" << std::endl << "Object count: " << heap.size() << std::endl << std::endl;

    for (const auto* el : heap)
    {
        if (!el)
        {
            throw std::runtime_error("Heap value is nullptr");
        }

        ss << "Obj: " << std::hex << el << std::endl;
        ss << "Value: " << GCStringConverter::convert(el) << std::endl;
        ss << formatVariableNames(el) << std::endl;

        ss << std::endl;
    }

    return ss.str();
}

static std::string formatRootInfo(Object** root)
{
    std::stringstream ss;
    ss << "Root**: " << std::hex << root << std::endl;
    return ss.str();
}

std::string GCPrinter::formatObjInfo(const Object* obj) const
{
    std::stringstream ss;
    ss << "Obj: " << std::hex << obj << std::endl;
    ss << "Value: " << GCStringConverter::convert(obj) << std::endl;
    ss << formatVariableNames(obj) << std::endl;

    return ss.str();
}

void GCPrinter::fillRootsGraph(gvl::Graph& graph, const roots_t& roots) const
{
    std::cout << ("Roots count: " + std::to_string(roots.size()) + "\n");

    visited_nodes_t visited;

    for (auto** o : roots)
    {
        if (!o || !*o)
        {
            throw std::runtime_error("Root value is nullptr");
        }

        auto rootId = gvl::NodeId(formatRootInfo(o));
        graph.AddNode(rootId, {gvl::Property("style", "bold"), gvl::Property("shape", "component")});

        auto id = gvl::NodeId(formatObjInfo(*o));
        graph.AddNode(id, {gvl::Property("shape", "component")});
        graph.AddEdge(rootId, id);

        visited.insert({*o, id});

        fillChildrenGraph(graph, id, *o, visited);
    }
}

void GCPrinter::fillChildrenGraph(gvl::Graph& graph,
                                  const gvl::NodeId& parentNode,
                                  Object* object,
                                  visited_nodes_t& visited) const
{
    if (!object)
    {
        throw std::runtime_error("Heap object value is nullptr");
    }

    const auto children = object->getChildObjects();
    for (auto* c : children)
    {
        if (!c)
        {
            throw std::runtime_error("Heap object child value is nullptr");
        }

        auto id = gvl::NodeId(formatObjInfo(c));

        if (visited.find(c) != visited.end())
        {
            graph.AddEdge(parentNode, id);
            continue;
        }
        visited.insert({c, id});

        graph.AddNode(id);
        graph.AddEdge(parentNode, id);

        fillChildrenGraph(graph, id, c, visited);
    }
}

std::string GCPrinter::formatVariableNames(const Object* object) const
{
    const auto entry = _variables.getObjectEntryWithHeap(object);
    std::stringstream ss;
    if (entry.valid) // TODO use std::optional instead when the c++ standard >= 17
    {
        ss << "Associated variable name: " << entry.variableName << std::endl;
        ss << "Associated scope name: " << entry.scopeName << std::endl;
    }
    return ss.str();
}
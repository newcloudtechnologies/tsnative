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

#include "std/tsobject.h"

#include "std/private/gc_string_converter.h"

#include <iostream>

void GCPrinter::print(const std::unordered_set<Object*>& heap, const std::unordered_set<Object**>& roots)
{
    std::cout << "\n----------------GC_STATE-----------------\n";
    std::cout << "\n----------------GRAPH--------------------\n";
    printGraph(roots);

    std::cout << "\n----------------HEAP---------------------\n";
    printHeap(heap);
    std::cout << "\n----------------END_GC_STATE-------------\n";
}

void GCPrinter::printHeap(const std::unordered_set<Object*>& heap) const
{
    std::cout << ("Heap size: " + std::to_string(heap.size()) + "\n");
    for (auto* h : heap)
    {
        if (!h)
        {
            throw std::runtime_error("Heap value is nullptr");
        }

        std::cout << "Obj: " << std::hex << ((void*)h) << std::endl;
        std::cout << (GCStringConverter::convert(h) + "\n\n");
    }
}

void GCPrinter::printGraph(const std::unordered_set<Object**>& roots)
{
    std::cout << ("Roots count: " + std::to_string(roots.size()) + "\n");
    for (auto** o : roots)
    {
        if (!o)
        {
            throw std::runtime_error("Root value is nullptr");
        }

        std::cout << "Root**: " << std::hex << ((void*)o) << std::endl;
        std::cout << "Root*: " << std::hex << ((void*)(*o)) << std::endl;

        _visited.insert(*o);
        printChildren("\t", *o);

        std::cout << std::endl;
    }
}

void GCPrinter::printChildren(const std::string& prefix, Object* object)
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

        std::cout << prefix << " Obj: " << std::hex << ((void*)c) << std::endl;
        if (_visited.find(c) != _visited.cend())
        {
            std::cout << "Cycle break\n";
            continue;
        }

        _visited.insert(c);
        printChildren(prefix + "\t", c);
    }
}
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
#include <unordered_set>

class Object;

class GCPrinter
{
public:
    void print(const std::unordered_set<Object*>& heap, const std::unordered_set<Object**>& roots);

private:
    void printGraph(const std::unordered_set<Object**>& roots);
    void printHeap(const std::unordered_set<Object*>& heap) const;

    void printChildren(const std::string& prefix, Object* object);

private:
    std::unordered_set<Object*> _visited;
};
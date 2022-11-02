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

#include "ClassDetails.h"
#include "InheritanceNode.h"

#include "parser/ClassItem.h"
#include "parser/FunctionItem.h"

#include <functional>
#include <string>
#include <vector>

namespace analyzer
{

class TypeChecker
{
public:
    static void check(const clang::QualType& type,
                      const clang::ASTContext& context,
                      std::function<std::string()> where);
};

class InheritanceChecker
{
private:
    bool hasObject = false;
    std::vector<std::string> objectInheritors;

private:
    InheritanceChecker(const InheritanceNode& node);

    static bool lookupObject(const std::vector<InheritanceNode>& bases);

    static void collectObjectInheritors(const InheritanceNode& current,
                                        const InheritanceNode& base,
                                        std::vector<std::string>& objectInheritors);

    static std::vector<std::string> lookupObjectInheritors(const InheritanceNode& node);

public:
    static void check(const InheritanceNode& node);
    static void check(parser::const_class_item_t item);
};

class ClassChecker
{
    static void overloads(parser::const_class_item_t item);
    static void types(parser::const_class_item_t item);

public:
    static void check(parser::const_class_item_t item);
};

class FunctionChecker
{
    static void overloads(parser::const_function_item_t item, const std::string& name);
    static void types(parser::const_function_item_t item);

public:
    static void check(parser::const_function_item_t item);
    static void check(parser::const_function_item_t item, const std::string& name);
};

} // namespace analyzer
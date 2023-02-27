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

#include "parser/ClassItem.h"
#include "parser/Collection.h"

#include <clang/AST/DeclCXX.h>

#include <optional>
#include <string>
#include <vector>

namespace analyzer
{

class InheritanceNode
{
private:
    parser::const_class_item_t m_item;
    std::string m_actualTypeName; // uses for non instantiated templates
    std::vector<InheritanceNode> m_bases;
    bool m_instantiated = true; // example; Iterator<T> - false, Rect<int, double> - true, Widget - true

private:
    InheritanceNode(const parser::Collection& collection,
                    parser::const_class_item_t item,
                    const std::string& actualTypeName,
                    bool instantiated = true);

    std::optional<parser::const_abstract_item_t> getItem(const parser::Collection& collection,
                                                         const std::string& path) const;
    std::string getType(const clang::CXXBaseSpecifier& it) const;
    std::vector<clang::CXXBaseSpecifier> getBases(parser::const_class_item_t item) const;

    std::string getTemplateName(const std::string& actualTypeName) const;

public:
    InheritanceNode(const InheritanceNode& other);
    InheritanceNode& operator=(const InheritanceNode& other);

    static InheritanceNode make(const parser::Collection& collection, parser::const_class_item_t item);

    parser::const_class_item_t item() const;
    std::string actualTypeName() const;
    std::string fullActualTypeName() const;
    std::vector<InheritanceNode> bases() const;
};

} // namespace analyzer

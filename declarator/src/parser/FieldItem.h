#pragma once

#include <clang/AST/Decl.h>
#include <clang/AST/DeclCXX.h>
#include <clang/AST/DeclTemplate.h>

#include <memory>
#include <string>
#include <vector>

namespace parser
{

class FieldItem;
using field_item_t = std::shared_ptr<FieldItem>;
using const_field_item_t = std::shared_ptr<const FieldItem>;

using field_item_list_t = std::vector<field_item_t>;
using const_field_item_list_t = std::vector<const_field_item_t>;

class FieldItem
{
    const clang::FieldDecl* m_decl;

private:
    FieldItem(const clang::FieldDecl* decl);

public:
    std::string name() const;
    clang::QualType type() const;

    const clang::FieldDecl* decl() const;

    template <typename... Args>
    static field_item_t make(Args&&... args)
    {
        field_item_t result;
        result.reset(new FieldItem(std::forward<Args>(args)...));
        return result;
    }
};

} //  namespace parser

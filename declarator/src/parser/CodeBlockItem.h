#pragma once

#include "ClassItem.h"

#include <string>

namespace parser
{

class CodeBlockItem : public ClassItem
{
    friend class AbstractItem;

private:
    CodeBlockItem(const std::string& name, const std::string& prefix, bool isLocal, const clang::CXXRecordDecl* decl);

public:
    std::string code() const;
};

using code_block_item_t = item_t<CodeBlockItem>;
using const_code_block_item_t = item_t<const CodeBlockItem>;

} //  namespace parser

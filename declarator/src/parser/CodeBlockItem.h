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

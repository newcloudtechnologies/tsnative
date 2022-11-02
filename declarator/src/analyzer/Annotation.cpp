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

#include "Annotation.h"

#include "parser/Annotation.h"
#include "parser/ClassItem.h"
#include "parser/ClassTemplateItem.h"
#include "parser/ClassTemplateSpecializationItem.h"
#include "parser/CodeBlockItem.h"
#include "parser/EnumItem.h"
#include "parser/FunctionItem.h"
#include "parser/FunctionTemplateItem.h"
#include "parser/NamespaceItem.h"
#include "parser/VariableItem.h"

#include "utils/Exception.h"

namespace analyzer
{

std::string getItemAnnotations(parser::const_abstract_item_t item)
{
    using namespace parser;

    std::string result;

    switch (item->type())
    {
        case AbstractItem::Type::NAMESPACE:
        {
            result = parser::getAnnotations(AbstractItem::decl<const NamespaceItem>(item));
            break;
        }
        case AbstractItem::Type::CODE_BLOCK:
        {
            result = parser::getAnnotations(AbstractItem::decl<const CodeBlockItem>(item));
            break;
        }
        case AbstractItem::Type::CLASS:
        {
            result = parser::getAnnotations(AbstractItem::decl<const ClassItem>(item));
            break;
        }
        case AbstractItem::Type::CLASS_TEMPLATE:
        {
            result = parser::getAnnotations(AbstractItem::decl<const ClassTemplateItem>(item));
            break;
        }
        case AbstractItem::Type::CLASS_TEMPLATE_SPECIALIZATION:
        {
            result = parser::getAnnotations(AbstractItem::decl<const ClassTemplateSpecializationItem>(item));
            break;
        }
        case AbstractItem::Type::ENUM:
        {
            result = parser::getAnnotations(AbstractItem::decl<const EnumItem>(item));
            break;
        }
        case AbstractItem::Type::FUNCTION:
        {
            result = parser::getAnnotations(AbstractItem::decl<const FunctionItem>(item));
            break;
        }
        case AbstractItem::Type::FUNCTION_TEMPLATE:
        {
            result = parser::getAnnotations(AbstractItem::decl<const FunctionTemplateItem>(item));
            break;
        }
        case AbstractItem::Type::VARIABLE:
        {
            result = parser::getAnnotations(AbstractItem::decl<const VariableItem>(item));
            break;
        }
        default:
        {
            throw utils::Exception(
                R"(type of items "%s" is not supported, %s)", typeToString(item->type()).c_str(), _STAMP());
        }
    };

    return result;
}

} // namespace analyzer

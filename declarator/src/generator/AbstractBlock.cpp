/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "AbstractBlock.h"
#include "ContainerBlock.h"
#include "FileBlock.h"
#include "Ignore.h"
#include "ModuleBlock.h"
#include "NamespaceBlock.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <map>

namespace generator
{

namespace ts
{

AbstractBlock::AbstractBlock(AbstractBlock::Type type, const std::string& name)
    : m_type(type)
    , m_name(name)
{
}

AbstractBlock::Type AbstractBlock::type() const
{
    return m_type;
}

std::string AbstractBlock::name() const
{
    return m_name;
}

void AbstractBlock::setParent(const_container_block_t parent)
{
    m_parent = parent;
}

const_container_block_t AbstractBlock::parent() const
{
    return m_parent;
}

void AbstractBlock::addDecorator(decorator_t decorator)
{
    m_decorators.push_back(decorator);
}

void AbstractBlock::setIgnore()
{
    m_hasIgnore = true;
}

void AbstractBlock::printDecorators(generator::print::printer_t printer) const
{
    for (const auto& it : m_decorators)
    {
        it->print(printer);
    }
}

void AbstractBlock::printIgnore(generator::print::printer_t printer) const
{
    if (m_hasIgnore)
    {
        Ignore::make()->print(printer);
    }
}

void AbstractBlock::printHeader(generator::print::printer_t printer) const
{
}

void AbstractBlock::printFooter(generator::print::printer_t printer) const
{
}

void AbstractBlock::print(generator::print::printer_t printer) const
{
    printDecorators(printer);
    printIgnore(printer);

    printHeader(printer);
    printBody(printer);
    printFooter(printer);
}

bool AbstractBlock::isContainerBlock(const_abstract_block_t block)
{
    switch (block->type())
    {
        case AbstractBlock::Type::FILE:
        case AbstractBlock::Type::MODULE:
        case AbstractBlock::Type::NAMESPACE:
        {
            return true;
        }
        default:
        {
            return false;
        }
    };
}

std::string typeToString(AbstractBlock::Type type)
{
    const std::map<int, std::string> types = {
        {AbstractBlock::Type::CLASS, "Class"},
        {AbstractBlock::Type::GENERIC_CLASS, "GenericClass"},
        {AbstractBlock::Type::COMMENT, "Comment"},
        {AbstractBlock::Type::CODE_BLOCK, "CodeBlock"},
        {AbstractBlock::Type::FIELD, "Field"},
        {AbstractBlock::Type::FILE, "File"},
        {AbstractBlock::Type::IMPORT, "Import"},
        {AbstractBlock::Type::METHOD, "Method"},
        {AbstractBlock::Type::GENERIC_METHOD, "GenericMethod"},
        {AbstractBlock::Type::COMPUTED_PROPERTY_NAME, "ComputedPropertyName"},
        {AbstractBlock::Type::INDEX_SIGNATURE, "IndexSignature"},
        {AbstractBlock::Type::FUNCTION, "Function"},
        {AbstractBlock::Type::GENERIC_FUNCTION, "GenericFunction"},
        {AbstractBlock::Type::MODULE, "Module"},
        {AbstractBlock::Type::NAMESPACE, "Namespace"},
        {AbstractBlock::Type::ENUM, "Enum"},
        {AbstractBlock::Type::ENUMERATOR, "Enumerator"},
    };

    _ASSERT(types.find(type) != types.end());

    return types.at(type);
}

} // namespace ts

} // namespace generator
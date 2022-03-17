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

#include "ClassBlock.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

ClassBlock::ClassBlock(const std::string& name, bool isExport, bool isDeclare)
    : AbstractBlock(Type::CLASS, name)
    , m_isExport(isExport)
    , m_isDeclare(isDeclare)
{
}

ClassBlock::ClassBlock(Type type, const std::string& name, bool isExport, bool isDeclare)
    : AbstractBlock(type, name)
    , m_isExport(isExport)
    , m_isDeclare(isDeclare)
{
}

std::string ClassBlock::formatExtends() const
{
    using namespace utils;

    std::string img;

    if (!m_extends.empty())
    {
        img = strprintf(R"(extends %s)", m_extends.c_str());
    }

    return img;
}

std::string ClassBlock::formatImplements() const
{
    using namespace utils;

    std::string img;

    if (!m_implements.empty())
    {
        img = strprintf(R"(implements %s)", join(m_implements).c_str());
    }

    return img;
}

void ClassBlock::addFields(const field_list_block_t& fields)
{
    m_fields.insert(m_fields.end(), fields.begin(), fields.end());
}

void ClassBlock::addMethods(const method_list_block_t& methods)
{
    m_methods.insert(m_methods.end(), methods.begin(), methods.end());
}

void ClassBlock::addGenericMethods(const generic_method_list_block_t& methods)
{
    m_genericMethods.insert(m_genericMethods.end(), methods.begin(), methods.end());
}

void ClassBlock::addClosures(const closure_list_block_t& closures)
{
    m_closures.insert(m_closures.end(), closures.begin(), closures.end());
}

void ClassBlock::addOperators(const operator_list_block_t& operators)
{
    m_operators.insert(m_operators.end(), operators.begin(), operators.end());
}

void ClassBlock::addExtends(const std::string& extends)
{
    m_extends = extends;
}

void ClassBlock::addImplements(const std::vector<std::string>& implements)
{
    m_implements = implements;
}

void ClassBlock::addCodeBlock(code_block_t codeBlock)
{
    m_codeBlocks.push_back(codeBlock);
}

void ClassBlock::printHeader(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string extends = formatExtends();
    std::string implements = formatImplements();

    std::string inherits =
        strprintf(R"(%s%s)",
                  !extends.empty() && !implements.empty() ? (extends + " ").c_str() : extends.c_str(),
                  implements.c_str());

    std::string img = strprintf(R"(%s%sclass %s %s{)",
                                m_isExport ? "export " : "",
                                m_isDeclare ? "declare " : "",
                                name().c_str(),
                                inherits.empty() ? "" : (inherits + " ").c_str());

    printer->print(img);
    printer->enter();
}

void ClassBlock::printBody(generator::print::printer_t printer) const
{
    printer->tab();

    print_blocks(m_fields, printer);
    print_blocks(m_methods, printer);
    print_blocks(m_genericMethods, printer);
    print_blocks(m_closures, printer);
    print_blocks(m_operators, printer);
    print_blocks(m_codeBlocks, printer);

    printer->backspace();
}

void ClassBlock::printFooter(generator::print::printer_t printer) const
{
    std::string img = "}";

    printer->print(img);
    printer->enter();
}

} // namespace ts
} // namespace generator
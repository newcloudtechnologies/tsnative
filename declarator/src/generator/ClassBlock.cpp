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

ClassBlock::ClassBlock(const std::string& name, bool isExport)
    : AbstractBlock(Type::CLASS, name)
    , m_isExport(isExport)
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

std::string ClassBlock::formatParameters() const
{
    using namespace utils;

    std::string img;

    if (!m_templateParameters.empty())
    {
        img = strprintf(R"(<%s>)", formatTemplateParameterList(m_templateParameters).c_str());
    }

    return img;
}

void ClassBlock::addField(const_field_block_t field)
{
    m_fields.push_back(field);
}

void ClassBlock::addMethod(const_method_block_t method)
{
    method->isStatic() ? m_staticMethods.push_back(method) : m_methods.push_back(method);
}

void ClassBlock::addClosure(const_method_block_t closure)
{
    m_closures.push_back(closure);
}

void ClassBlock::addTemplateParameter(const TemplateParameterValue& p)
{
    m_templateParameters.push_back(p);
}

void ClassBlock::addExtends(const std::string& extends)
{
    m_extends = extends;
}

void ClassBlock::addImplements(const std::vector<std::string>& implements)
{
    m_implements = implements;
}

void ClassBlock::printHeader(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string extends = formatExtends();
    std::string implements = formatImplements();
    std::string parameters = formatParameters();

    std::string inherits = strprintf(
        R"(%s%s)", append_if(!extends.empty() && !implements.empty(), extends, " ").c_str(), implements.c_str());

    std::string img = strprintf(R"(%sclass %s%s %s{)",
                                m_isExport ? "export " : "",
                                name().c_str(),
                                parameters.c_str(),
                                append_if(!inherits.empty(), inherits, " ").c_str());

    printer->print(img);
    printer->enter();
}

void ClassBlock::printBody(generator::print::printer_t printer) const
{
    printer->tab();

    for (auto i = 0; i < m_fields.size(); i++)
    {
        m_fields.at(i)->print(printer);

        if (i == m_fields.size() - 1 && !m_fields.empty())
        {
            printer->enter();
        }
    }

    for (auto i = 0; i < m_methods.size(); i++)
    {
        m_methods.at(i)->print(printer);

        if (m_methods.at(i)->isConstructor() && m_methods.size() > 1)
        {
            printer->enter();
        }

        if (i == m_methods.size() - 1 && !m_staticMethods.empty())
        {
            printer->enter();
        }
    }

    for (auto i = 0; i < m_staticMethods.size(); i++)
    {
        m_staticMethods.at(i)->print(printer);

        if (i == m_staticMethods.size() - 1 && !m_closures.empty())
        {
            printer->enter();
        }
    }

    for (auto i = 0; i < m_closures.size(); i++)
    {
        m_closures.at(i)->print(printer);
    }

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
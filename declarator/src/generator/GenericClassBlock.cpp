#include "GenericClassBlock.h"
#include "utils/Strings.h"

namespace generator
{

namespace ts
{

GenericClassBlock::GenericClassBlock(const std::string& name, bool isExport, bool isDeclare)
    : ClassBlock(Type::GENERIC_CLASS, name, isExport, isDeclare)
{
}

std::string GenericClassBlock::formatTemplateParameters() const
{
    using namespace utils;

    std::string img;

    if (!m_templateParameters.empty())
    {
        img = strprintf(R"(<%s>)", formatTemplateParameterList(m_templateParameters).c_str());
    }

    return img;
}

void GenericClassBlock::addTemplateParameter(const TemplateParameterValue& p)
{
    m_templateParameters.push_back(p);
}

void GenericClassBlock::printHeader(generator::print::printer_t printer) const
{
    using namespace utils;

    std::string extends = formatExtends();
    std::string implements = formatImplements();
    std::string templateParameters = formatTemplateParameters();

    std::string inherits =
        strprintf(R"(%s%s)",
                  !extends.empty() && !implements.empty() ? (extends + " ").c_str() : extends.c_str(),
                  implements.c_str());

    std::string img = strprintf(R"(%s%sclass %s%s %s{)",
                                m_isExport ? "export " : "",
                                m_isDeclare ? "declare " : "",
                                name().c_str(),
                                templateParameters.c_str(),
                                inherits.empty() ? "" : (inherits + " ").c_str());

    printer->print(img);
    printer->enter();
}

} // namespace ts
} // namespace generator
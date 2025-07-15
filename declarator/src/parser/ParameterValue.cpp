#include "ParameterValue.h"

namespace parser
{

ParameterValue::ParameterValue(const clang::ParmVarDecl* decl)
    : m_decl(decl)
{
}

std::string ParameterValue::name() const
{
    return m_decl->getNameAsString();
}

clang::QualType ParameterValue::type() const
{
    return m_decl->getType();
}

bool ParameterValue::isParameterPack() const
{
    return m_decl->isParameterPack();
}

bool ParameterValue::isPointerType() const
{
    return m_decl->getType()->isAnyPointerType();
}

bool ParameterValue::isTemplated() const
{
    return m_decl->isTemplated();
}

const clang::ParmVarDecl* ParameterValue::decl() const
{
    return m_decl;
}

} //  namespace parser

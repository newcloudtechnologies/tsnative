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

#include "ClassTemplateItem.h"
#include "TemplateInstantiator.h"

#include "utils/Exception.h"

#include "global/Settings.h"

namespace parser
{

ClassTemplateItem::ClassTemplateItem(const std::string& name,
                                     const std::string& prefix,
                                     bool isLocal,
                                     bool isCompletedDecl,
                                     const clang::ClassTemplateDecl* decl)
    : ClassItem(AbstractItem::Type::CLASS_TEMPLATE, name, prefix, isLocal, isCompletedDecl, decl->getTemplatedDecl())
    , m_decl(decl)
{
}

std::vector<TemplateParameterValue> ClassTemplateItem::templateParameters() const
{
    return getTemplateParameters(m_decl);
}

int ClassTemplateItem::size() const
{
    using namespace global;

    auto& settings = Settings::get();

    if (m_size < 0)
    {
        // size of templated class is size of specialization
        ClassTemplateInstantiator instantiator(shared_from_this(),
                                               settings.source(),
                                               settings.includeDirs(),
                                               settings.definitions(),
                                               settings.compilerAbi(),
                                               settings.sysroot());

        auto instance = instantiator.instantiate();

        m_size = instance->size();
    }

    return m_size;
}

const clang::ClassTemplateDecl* ClassTemplateItem::decl() const
{
    return m_decl;
}

} //  namespace parser
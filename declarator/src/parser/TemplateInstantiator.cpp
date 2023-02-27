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

#include "TemplateInstantiator.h"
#include "Diagnostics.h"

#include "utils/Env.h"
#include "utils/Exception.h"
#include "utils/Strings.h"

#include <filesystem>
#include <fstream>
#include <iostream>

namespace
{

std::string getInstancePath(const std::string& templateName)
{
    namespace fs = std::filesystem;

    std::string DECLARATOR_TEMP_DIR = utils::getEnv("DECLARATOR_TEMP_DIR");

    if (DECLARATOR_TEMP_DIR.empty())
    {
        fs::path DECLARATOR_OUTPUT_DIR(utils::getEnv("DECLARATOR_OUTPUT_DIR"));

        DECLARATOR_OUTPUT_DIR = DECLARATOR_OUTPUT_DIR / "temp";

        DECLARATOR_TEMP_DIR = DECLARATOR_OUTPUT_DIR.u8string();
    }

    fs::path path(DECLARATOR_TEMP_DIR);

    create_directories(path);

    std::string fn = utils::strprintf(R"(%s_instance.h)", templateName.c_str());

    path = path / fn;

    return path.string();
}

} //  namespace

namespace parser
{

class ClassTemplateInstantiator::Finder : public Visitor
{
private:
    ClassTemplateInstantiator& m_owner;

private:
    void enterScope(const clang::NamedDecl* decl) override
    {
        // no internal scopes: do nothing
    }

    void releaseScope(const clang::NamedDecl* decl) override
    {
        // no internal scopes: do nothing
    }

    Result onVisit(const clang::NamedDecl* decl, bool isLocal) override
    {
        using namespace clang;

        auto kind = decl->getKind();

        if (kind == Decl::Kind::ClassTemplateSpecialization && isLocal)
        {
            const auto* classTemplateSpecializationDecl =
                clang::dyn_cast_or_null<clang::ClassTemplateSpecializationDecl>(decl);
            _ASSERT(classTemplateSpecializationDecl);

            _ASSERT(classTemplateSpecializationDecl->getTemplateInstantiationPattern());

            bool isCompletedDecl = classTemplateSpecializationDecl->isThisDeclarationADefinition();

            // prefix is always empty because instance located in root scope
            parser::class_item_t item =
                AbstractItem::make<ClassItem>(classTemplateSpecializationDecl->getNameAsString(),
                                              "",
                                              isLocal,
                                              isCompletedDecl,
                                              classTemplateSpecializationDecl);

            m_owner.addInstance(item);

            return Result::CONTINUE;
        }

        return Result::IGNORE;
    }

public:
    Finder(const CXTranslationUnit& tu, ClassTemplateInstantiator& owner)
        : Visitor(tu)
        , m_owner(owner)
    {
    }
};

ClassTemplateInstantiator::ClassTemplateInstantiator(parser::const_class_template_item_t classTemplateItem,
                                                     const std::string& source_path,
                                                     const std::vector<std::string>& include_dirs,
                                                     const std::vector<std::string>& definitions,
                                                     const std::string& compiler_abi,
                                                     const std::string& sys_root)
{
    // include source header into instance
    m_instancePath = createInstance(classTemplateItem, {source_path});
    m_tu = createTranslationUnit(m_instancePath, include_dirs, definitions, compiler_abi, sys_root);
}

ClassTemplateInstantiator::~ClassTemplateInstantiator()
{
    deleteTranslationUnit(m_tu);

    deleteInstance(m_instancePath);
}

parser::const_class_item_t ClassTemplateInstantiator::instantiate()
{
    Finder finder(m_tu, *this);

    finder.start();

    return m_instance;
}

void ClassTemplateInstantiator::addInstance(parser::const_class_item_t item)
{
    _ASSERT(!m_instance);

    m_instance = item;
}

std::string ClassTemplateInstantiator::createInstance(parser::const_class_template_item_t item,
                                                      const std::vector<std::string>& includes)
{
    auto formatName = [item]()
    {
        std::string prefix = item->prefix();
        std::string name = item->name();

        return prefix.empty() ? name : utils::strprintf("%s::%s", prefix.c_str(), name.c_str());
    };

    auto formatParameters = [item]()
    {
        std::string result;

        auto size = item->templateParameters().size();

        _ASSERT(size > 0);

        for (auto i = 0; i < size; i++)
        {
            result += "void*";

            if (i < size - 1)
            {
                result += ", ";
            }
        }

        return result;
    };

    std::string image;

    std::string instance_fn = getInstancePath(item->name());

    std::ofstream instance_file(instance_fn, std::ios::out | std::ios::binary);

    for (const auto& it : includes)
    {
        image += utils::strprintf(R"(#include "%s")", it.c_str());
        image += "\n";
    }

    image += "\n";

    image += utils::strprintf(R"(template class %s<%s>;)", formatName().c_str(), formatParameters().c_str());

    instance_file.write(image.c_str(), image.size());
    instance_file.flush();

    return instance_fn;
}

void ClassTemplateInstantiator::deleteInstance(const std::string& instance_path)
{
    namespace fs = std::filesystem;

    fs::path path(instance_path);

    fs::remove(path);
}

CXTranslationUnit ClassTemplateInstantiator::createTranslationUnit(const std::string& instance_path,
                                                                   const std::vector<std::string>& include_dirs,
                                                                   const std::vector<std::string>& definitions,
                                                                   const std::string& compiler_abi,
                                                                   const std::string& sys_root)
{
    std::string target = utils::strprintf("--target=%s", compiler_abi.c_str());
    std::string sysroot = !sys_root.empty() ? utils::strprintf("--sysroot=%s", sys_root.c_str()) : "";

    std::vector<std::string> Is;
    std::vector<std::string> Ds;

    for (const auto& it : include_dirs)
    {
        Is.push_back("-I");
        Is.push_back(it);
    }

    for (const auto& it : definitions)
    {
        Ds.push_back("-D");
        Ds.push_back(it);
    }

    std::vector<const char*> args = {"-x", "c++", target.c_str()};

    if (!sysroot.empty())
    {
        args.push_back(sysroot.c_str());
    }

    for (const auto& it : Is)
    {
        args.push_back(it.c_str());
    }

    for (const auto& it : Ds)
    {
        args.push_back(it.c_str());
    }

    bool excludeDeclarationsFromPCH = false;
    bool displayDiagnostics = false;
    CXIndex index = clang_createIndex((int)excludeDeclarationsFromPCH, (int)displayDiagnostics);
    CXTranslationUnit unit;

    if (clang_parseTranslationUnit2(
            index, instance_path.c_str(), &args[0], args.size(), 0, 0, CXTranslationUnit_None, &unit) !=
        CXErrorCode::CXError_Success)
    {
        throw utils::Exception(R"(translation unit was not created: "%s")", instance_path.c_str());
    }

    Diagnostics diag = Diagnostics::get(unit);

    if (!diag.check())
    {
        throw utils::Exception(R"(instantiation failed: "%s")", diag.print().c_str());
    }

    return unit;
}

void ClassTemplateInstantiator::deleteTranslationUnit(CXTranslationUnit tu)
{
    clang_disposeTranslationUnit(tu);
}

} //  namespace parser

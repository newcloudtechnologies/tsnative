#pragma once

#include "ClassItem.h"
#include "ClassTemplateItem.h"
#include "Visitor.h"

#include <clang-c/Index.h>

#include <string>
#include <vector>

namespace parser
{

class ClassTemplateInstantiator
{
    class Finder;

private:
    parser::const_class_item_t m_instance;
    std::string m_instancePath;
    CXTranslationUnit m_tu = nullptr;

private:
    void addInstance(parser::const_class_item_t item);

private:
    std::string createInstance(parser::const_class_template_item_t item, const std::vector<std::string>& includes);
    void deleteInstance(const std::string& instance_path);

    CXTranslationUnit createTranslationUnit(const std::string& instance_path,
                                            const std::vector<std::string>& include_dirs,
                                            const std::vector<std::string>& definitions,
                                            const std::string& compiler_abi,
                                            const std::string& sys_root);
    void deleteTranslationUnit(CXTranslationUnit tu);

public:
    ClassTemplateInstantiator(parser::const_class_template_item_t classTemplateItem,
                              const std::string& source_path,
                              const std::vector<std::string>& include_dirs,
                              const std::vector<std::string>& definitions,
                              const std::string& compiler_abi,
                              const std::string& sys_root);
    ~ClassTemplateInstantiator();

    parser::const_class_item_t instantiate();
};

} //  namespace parser
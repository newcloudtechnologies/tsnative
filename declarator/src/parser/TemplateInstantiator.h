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
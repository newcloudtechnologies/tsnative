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

#include <functional>
#include <string>
#include <vector>

#pragma once

namespace global
{

class Settings
{
private:
    std::string m_source;
    std::string m_compiler_abi;
    std::string m_sysroot;
    std::vector<std::string> m_include_dirs;
    std::vector<std::string> m_definitions;

private:
    Settings();
    void do_init(int argc, char** argv);
    void visit(const std::vector<std::string>& args,
               std::function<void(const std::string& opt, const std::string& val)> handler);

public:
    static Settings& get();
    static void init(int argc, char** argv);

    std::string source() const;
    std::string compilerAbi() const;
    std::string sysroot() const;
    std::vector<std::string> includeDirs() const;
    std::vector<std::string> definitions() const;
};

} // namespace global

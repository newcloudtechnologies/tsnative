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

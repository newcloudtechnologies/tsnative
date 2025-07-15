#include "Settings.h"
#include "utils/Exception.h"
#include "utils/Strings.h"

namespace global
{

Settings::Settings()
{
}

void Settings::do_init(int argc, char** argv)
{
    std::vector<std::string> args(argv + 1, argv + argc);

    visit(args,
          [this](const std::string& opt, const std::string& val)
          {
              if (opt == "I")
              {
                  m_include_dirs.push_back(val);
              }
              if (opt == "D")
              {
                  m_definitions.push_back(val);
              }
              else if (opt == "target")
              {
                  m_compiler_abi = val;
              }
              else if (opt == "sysroot")
              {
                  m_sysroot = val;
              }
              else if (opt == "")
              {
                  m_source = val;
              }
          });
}

void Settings::visit(const std::vector<std::string>& args,
                     std::function<void(const std::string& opt, const std::string& val)> handler)
{
    using namespace utils;

    auto getLongOption = [&args](auto index, std::string& left, std::string& right) -> int
    {
        _ASSERT(index >= 0 && index < args.size());

        std::string opt = args.at(index);
        std::size_t delim = opt.find("=");
        _ASSERT(delim != opt.npos);
        _ASSERT(delim > 2); // --longopt=value

        left = opt.substr(2, delim - 2);
        right = opt.substr(delim + 1);

        return index;
    };

    auto getShortOption = [&args](auto index, std::string& left, std::string& right) -> int
    {
        auto result = index;

        _ASSERT(index >= 0 && index < args.size());

        std::string opt = args.at(index);

        if (opt.size() == 2) // -D ANYDEFINE
        {
            left = opt.substr(1, 1);

            result++;
            _ASSERT(result < args.size());

            right = args.at(result);
        }
        else if (opt.size() > 2) // -DANYDEFINE
        {
            left = opt.substr(1, 1);
            right = opt.substr(2);
        }
        else
        {
            throw utils::Exception(R"(incorrect short option: "%s")", opt.c_str());
        }

        return result;
    };

    for (auto i = 0; i < args.size(); i++)
    {
        std::string current = args.at(i);

        if (starts_with(current, "--"))
        {
            std::string left, right;
            i = getLongOption(i, left, right);
            handler(left, right);
        }
        else if (starts_with(current, "-"))
        {
            std::string left, right;
            i = getShortOption(i, left, right);
            handler(left, right);
        }
        else
        {
            handler("", current);
        }
    }
}

Settings& Settings::get()
{
    static Settings settings;
    return settings;
}

void Settings::init(int argc, char** argv)
{
    auto& settings = Settings::get();
    settings.do_init(argc, argv);
}

std::string Settings::source() const
{
    return m_source;
}

std::string Settings::compilerAbi() const
{
    return m_compiler_abi;
}

std::string Settings::sysroot() const
{
    return m_sysroot;
}

std::vector<std::string> Settings::includeDirs() const
{
    return m_include_dirs;
}

std::vector<std::string> Settings::definitions() const
{
    return m_definitions;
}

} // namespace global

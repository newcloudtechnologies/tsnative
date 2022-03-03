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
              else if (opt == "target")
              {
                  m_compiler_abi = val;
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

    auto nextIndex = [args](auto index)
    {
        auto next = index + 1;
        return (next > 0 && next < args.size()) ? next : -1;
    };

    auto getOpt = [args](auto index)
    {
        _ASSERT(index >= 0 && index < args.size());
        return args.at(index);
    };

    auto getValue = [](const std::string& opt)
    {
        std::size_t delim = opt.find("=");
        _ASSERT(delim != opt.npos);

        std::string value = opt.substr(delim + 1);

        return value;
    };

    for (auto i = 0; i < args.size(); i++)
    {
        std::string current = args.at(i);

        if (starts_with(current, "--"))
        {
            if (starts_with(current, "--target"))
            {
                handler("target", getValue(current));
            }
        }
        else if (starts_with(current, "-"))
        {
            if (starts_with(current, "-I"))
            {
                i = nextIndex(i);
                handler("I", getOpt(i));
            }
            else if (starts_with(current, "-D"))
            {
                i = nextIndex(i);
                handler("D", getOpt(i));
            }
            else
            {
                if (!starts_with(getOpt(i + 1), "-"))
                {
                    i++;
                }
            }
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

std::vector<std::string> Settings::includeDirs() const
{
    return m_include_dirs;
}

} // namespace global

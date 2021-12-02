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

#include <regex>
#include <string>
#include <vector>

namespace analyzer
{

class TsMethodSignature
{
public:
    struct Argument
    {
        std::string name;
        std::string type;
        bool isSpread;
    };

private:
    std::string m_name;
    std::vector<Argument> m_arguments;
    std::string m_retType;

private:
    void parseFunction(const std::string& sig);
    void parseArgumentList(const std::string& args);
    void parseArgument(const std::string& arg);

public:
    TsMethodSignature(const std::string& sig);

    std::string name() const;
    std::string retType() const;
    std::vector<Argument> arguments() const;
};

} // namespace analyzer

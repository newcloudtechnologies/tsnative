#include <string>
#include <vector>

namespace analyzer
{

class TsSignature
{
public:
    enum Type
    {
        UNKNOWN,
        METHOD,
        GENERIC_METHOD,
        FUNCTION,
        GENERIC_FUNCTION,
        COMPUTED_PROPERTY_NAME,
        INDEX_SIGNATURE,
    };

    struct Argument
    {
        std::string name;
        std::string type;
        bool isSpread;
        bool isOptional;
    };

private:
    Type m_type = Type::UNKNOWN;
    std::string m_name;
    std::string m_accessor;
    std::vector<Argument> m_arguments;
    std::vector<std::string> m_templateArguments;
    std::string m_retType;

private:
    std::string normalize(const std::string& sig);
    void parse(const std::string& sig);
    std::vector<Argument> parseArgumentList(const std::string& args);
    TsSignature::Argument parseArgument(const std::string& args);
    std::vector<std::string> parseTemplateArguments(const std::string& arg);

public:
    TsSignature(const std::string& sig);

    Type type() const;
    std::string name() const;
    std::string accessor() const;
    std::string retType() const;
    std::vector<Argument> arguments() const;
    std::vector<std::string> templateArguments() const;
};

class TsImport
{
private:
    std::string m_path;
    std::vector<std::string> m_entities;

private:
    void parse(const std::string& sig);
    void parseEntityList(const std::string& sig);

public:
    TsImport(const std::string& sig);
    std::string path() const;
    std::vector<std::string> entities() const;
};

} // namespace analyzer

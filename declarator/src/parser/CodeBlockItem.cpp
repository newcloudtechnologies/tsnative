#include "CodeBlockItem.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include "global/Annotations.h"

#include "Annotation.h"

#include <sstream>

namespace parser
{

CodeBlockItem::CodeBlockItem(const std::string& name,
                             const std::string& prefix,
                             bool isLocal,
                             const clang::CXXRecordDecl* decl)
    : ClassItem(
          AbstractItem::Type::CODE_BLOCK, name, prefix, isLocal, true, decl) // CodeBlock always has completed decl
{
}

std::string CodeBlockItem::code() const
{
    using namespace global::annotations;

    AnnotationList annotations(getAnnotations(decl()));

    std::vector<std::string> values = annotations.values(TS_CODE);

    _ASSERT(values.size() == 1);

    std::istringstream iss(annotations.values(TS_CODE).at(0));
    std::vector<std::string> lines;
    std::string line;

    while (std::getline(iss, line, '\n'))
    {
        utils::trim_if(line, [](char ch) { return ch != ' ' && ch != '\"'; });
        lines.push_back(line);
    }

    std::string result = utils::join(lines, "\n") + "\n";

    return result;
}

} //  namespace parser
#include "Diagnostics.h"

#include <iostream>
#include <sstream>

namespace parser
{

bool Diagnostics::check() const
{
    return fatal_errors.empty() && errors.empty();
}

std::string Diagnostics::print() const
{
    std::ostringstream out;

    for (const auto& it : fatal_errors)
    {
        out << it << "\n";
    }

    for (const auto& it : errors)
    {
        out << it << "\n";
    }

    for (const auto& it : warnings)
    {
        out << it << "\n";
    }

    return out.str();
}

Diagnostics Diagnostics::get(CXTranslationUnit unit)
{
    Diagnostics result;

    for (int i = 0; i != clang_getNumDiagnostics(unit); ++i)
    {
        CXDiagnostic diag = clang_getDiagnostic(unit, i);
        CXString diag_msg = clang_formatDiagnostic(diag, clang_defaultDiagnosticDisplayOptions());

        CXDiagnosticSeverity severity = clang_getDiagnosticSeverity(diag);

        switch (severity)
        {
            case CXDiagnosticSeverity::CXDiagnostic_Fatal:
            {
                std::string msg = clang_getCString(diag_msg);
                result.fatal_errors.push_back(msg);
                break;
            }
            case CXDiagnosticSeverity::CXDiagnostic_Error:
            {
                std::string msg = clang_getCString(diag_msg);
                result.errors.push_back(msg);
                break;
            }
            case CXDiagnosticSeverity::CXDiagnostic_Warning:
            case CXDiagnosticSeverity::CXDiagnostic_Note:
            {
                std::string msg = clang_getCString(diag_msg);
                result.warnings.push_back(msg);
                break;
            }
        };

        clang_disposeString(diag_msg);
        clang_disposeDiagnostic(diag);
    }

    return result;
}

} //  namespace parser

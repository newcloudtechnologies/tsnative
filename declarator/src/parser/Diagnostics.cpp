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

#include "Diagnostics.h"

#include <cstring>
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

#pragma message "Diagnostic checks are disabled for Android targets"
    // Nasty hack for Android - treat any errors as warnings
    if (!result.check())
    {
        CXTargetInfo info = clang_getTranslationUnitTargetInfo(unit);
        CXString triple = clang_TargetInfo_getTriple(info);
        const char* triple_str = clang_getCString(triple);
        if (strstr(triple_str, "android"))
        {
            std::cerr << "WARNING: [" << triple_str << "] ignoring diagnostics errors:" << std::endl << result.print();
            result.warnings.insert(result.warnings.end(), result.errors.begin(), result.errors.end());
            result.warnings.insert(result.warnings.end(), result.fatal_errors.begin(), result.fatal_errors.end());
            result.fatal_errors.clear();
            result.errors.clear();
        }
        clang_disposeString(triple);
    }

    return result;
}

} //  namespace parser

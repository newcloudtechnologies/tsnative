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

#include "analyzer/Analyzer.h"
#include "analyzer/TypeUtils.h"

#include "generator/CommentBlock.h"
#include "generator/FileBlock.h"
#include "generator/Printer.h"

#include "parser/Collection.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <clang-c/Index.h>
#include <clang/AST/Type.h>

#include <algorithm>
#include <cstdlib>
#include <ctime>
#include <exception>
#include <filesystem>
#include <iostream>
#include <regex>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

std::string getEnv(const std::string& env)
{
    char* value = std::getenv(env.c_str());
    return (value == NULL) ? "" : value;
}

std::string getTUFilename(CXTranslationUnit unit)
{
    std::string p = clang_getCString(clang_getTranslationUnitSpelling(unit));
    std::filesystem::path fullPath(p);
    std::string result = fullPath.filename().string();

    return result;
}

class Diagnostics
{
    friend Diagnostics getDiagnostic(CXTranslationUnit unit);

    std::vector<std::string> fatal_errors;
    std::vector<std::string> errors;
    std::vector<std::string> warnings;

public:
    bool check() const
    {
        return fatal_errors.empty() && errors.empty();
    }

    std::string print() const
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

    static Diagnostics get(CXTranslationUnit unit)
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
};

generator::ts::block_t<generator::ts::File> makeFile()
{
    using namespace generator::ts;
    using namespace utils;

    std::time_t t = std::time(0); // get time now
    std::tm* now = std::localtime(&t);
    int current_year = now->tm_year + 1900;

    std::string template_head =

        "Copyright (c) New Cloud Technologies, Ltd., 2014-%d\n\n"

        "You can not use the contents of the file in any way without\n"
        "New Cloud Technologies, Ltd. written permission.\n\n"

        "To obtain such a permit, you should contact New Cloud Technologies, Ltd.\n"
        "at http://ncloudtech.com/contact.html\n\n"

        "This file is created automatically.\n"
        "Don't edit this file.\n";

    std::string head = strprintf(template_head.c_str(), current_year);

    auto file = AbstractBlock::make<File>();

    auto comment = AbstractBlock::make<CommentBlock>(head);

    file->add(comment);

    return file;
}

std::vector<std::pair<std::string, std::string>> getImports()
{
    using namespace utils;

    std::vector<std::pair<std::string, std::string>> result;

    std::string DECLARATOR_IMPORT = getEnv("DECLARATOR_IMPORT");

    if (!DECLARATOR_IMPORT.empty())
    {
        for (const auto& it : split(DECLARATOR_IMPORT, ","))
        {
            std::vector<std::string> parts = split(it, ":");
            _ASSERT(parts.size() == 2);

            result.push_back(std::make_pair(parts.at(0), parts.at(1)));
        }
    }

    return result;
}

generator::print::printer_t makePrinter(const std::string& filename)
{
    using namespace generator::print;

    std::string DECLARATOR_OUTPUT_DIR = getEnv("DECLARATOR_OUTPUT_DIR");

    sheet_t sheet;

    if (!DECLARATOR_OUTPUT_DIR.empty())
    {
        std::filesystem::path fullPath(DECLARATOR_OUTPUT_DIR);

        fullPath = fullPath / filename;

        sheet = generator::print::AbstractSheet::makeFromFile(fullPath.string());
    }
    else
    {
        sheet = generator::print::AbstractSheet::makeFromStdOut();
    }

    return Printer::make(generator::print::PT_preset2, sheet);
}

int main(int argc, char** argv)
{
    using namespace generator::ts;
    using namespace parser;
    using namespace analyzer;
    using namespace utils;

    try
    {
        bool excludeDeclarationsFromPCH = false;
        bool displayDiagnostics = false;
        CXIndex index = clang_createIndex((int)excludeDeclarationsFromPCH, (int)displayDiagnostics);

        CXTranslationUnit unit;

        if (clang_parseTranslationUnit2(index, 0, argv, argc, 0, 0, CXTranslationUnit_None, &unit) !=
            CXErrorCode::CXError_Success)
        {
            throw std::runtime_error("Translation unit was not created");
        }

        Diagnostics diag = Diagnostics::get(unit);

        if (!diag.check())
        {
            throw std::runtime_error(diag.print());
        }

        std::string tuFn = getTUFilename(unit);

        if (tuFn.rfind(".") != std::string::npos)
        {
            tuFn = tuFn.substr(0, tuFn.rfind(".")) += ".d.ts";
        }
        else
        {
            tuFn += ".d.ts";
        }

        auto printer = makePrinter(tuFn);

        CXCursor cursor = clang_getTranslationUnitCursor(unit);

        Collection::init(cursor);

        auto typeMapper = makeTypeMapper(Collection::get());

        abstract_block_t file = makeFile();

        auto imports = getImports();

        for (const auto& it : getSuitableItems(Collection::get()))
        {
            file = analyze(it, typeMapper, imports, file);
        }

        file->print(printer);

        clang_disposeTranslationUnit(unit);
        clang_disposeIndex(index);
    }
    catch (std::exception& e)
    {
        std::cerr << "Declarator failed:\n" << e.what() << "\n";
        exit(-1);
    }
}

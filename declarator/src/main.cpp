/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "analyzer/Analyzer.h"
#include "analyzer/TsUtils.h"
#include "analyzer/TypeUtils.h"

#include "generator/CommentBlock.h"
#include "generator/FileBlock.h"
#include "generator/ImportBlock.h"
#include "generator/Printer.h"

#include "parser/Collection.h"
#include "parser/Diagnostics.h"

#include "utils/Env.h"
#include "utils/Exception.h"
#include "utils/Strings.h"

#include "global/Settings.h"

#include <clang-c/Index.h>
#include <clang/AST/Type.h>

#include <algorithm>
#include <cstdlib>
#include <ctime>
#include <exception>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

namespace
{

const std::string file_head =

    "Copyright (c) New Cloud Technologies, Ltd., 2014-%d\n\n"

    "You can not use the contents of the file in any way without\n"
    "New Cloud Technologies, Ltd. written permission.\n\n"

    "To obtain such a permit, you should contact New Cloud Technologies, Ltd.\n"
    "at http://ncloudtech.com/contact.html\n\n"

    "This file is created automatically.\n"
    "Don't edit this file.\n";

const std::string stdImportSignatures =

    R"(import { pointer } from "tsnative/std/definitions/lib.std.numeric";)"
    R"(import { VTable, VTableSize, VirtualDestructor, Virtual } from "tsnative/std/decorators/decorators";)"
    R"(import { TSClosure } from "tsnative/std/definitions/tsclosure";)";

void printCollection(const parser::Collection& collection, const std::string& filename = "collection.txt")
{
    using namespace parser;

    struct Row
    {
        std::string prefix;
        std::string name;
        std::string type;
    };

    std::vector<Row> rows;

    std::ofstream ofs{filename, std::ofstream::out};

    Collection::ref().visit(
        [&rows](const_abstract_item_t item) {
            rows.push_back({item->prefix(), item->name(), typeToString(item->type())});
        });

    auto prefix_max_size =
        std::max_element(
            rows.begin(), rows.end(), [](const auto& a, const auto& b) { return a.prefix.size() < b.prefix.size(); })
            ->prefix.size();

    auto name_max_size = std::max_element(rows.begin(),
                                          rows.end(),
                                          [](const auto& a, const auto& b) { return a.name.size() < b.name.size(); })
                             ->name.size();

    auto type_max_size = std::max_element(rows.begin(),
                                          rows.end(),
                                          [](const auto& a, const auto& b) { return a.type.size() < b.type.size(); })
                             ->type.size();

    for (const auto& it : rows)
    {
        ofs.width(prefix_max_size + 3);
        ofs << it.prefix << " | ";
        ofs.width(name_max_size + 3);
        ofs << it.name << " | ";
        ofs.width(type_max_size);
        ofs << it.type << "\n";
    }
}

} //  namespace

std::string getDeclarationName(const std::string& source)
{
    std::filesystem::path source_path(source);
    std::string source_fn = source_path.filename().string();

    std::string result = source_fn;

    if (result.rfind(".") != std::string::npos)
    {
        result = result.substr(0, result.rfind(".")) += ".d.ts";
    }
    else
    {
        result += ".d.ts";
    }

    return result;
}

generator::ts::block_t<generator::ts::File> makeFile()
{
    using namespace generator::ts;
    using namespace utils;

    std::time_t t = std::time(0); // get time now
    std::tm* now = std::localtime(&t);
    int current_year = now->tm_year + 1900;

    auto file = AbstractBlock::make<File>();

    std::string DECLARATOR_NO_HEAD = utils::toUpperCase(utils::getEnv("DECLARATOR_NO_HEAD"));

    if (!(DECLARATOR_NO_HEAD == "TRUE" || DECLARATOR_NO_HEAD == "ON" || DECLARATOR_NO_HEAD == "YES"))
    {
        std::string head = strprintf(file_head.c_str(), current_year);

        auto comment = AbstractBlock::make<CommentBlock>(head);

        file->add(comment);
    }

    return file;
}

std::vector<generator::ts::import_block_t> getImports(const std::string& signatures,
                                                      std::vector<generator::ts::import_block_t> imports = {})
{
    using namespace utils;
    using namespace analyzer;
    using namespace generator::ts;

    for (const auto& it : split(signatures, ";"))
    {
        if (!it.empty())
        {
            TsImport signature(it);
            imports.push_back(AbstractBlock::make<ImportBlock>(signature.path(), signature.entities()));
        }
    }

    return imports;
}

generator::print::printer_t makePrinter(const std::string& filename)
{
    using namespace generator::print;

    std::string DECLARATOR_OUTPUT_DIR = utils::getEnv("DECLARATOR_OUTPUT_DIR");

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
    using namespace global;
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

        Settings::init(argc, argv);

        Collection::init(unit);

        std::string declaration_fn = getDeclarationName(Settings::get().source());

        auto printer = makePrinter(declaration_fn);

        auto typeMapper = makeTypeMapper(Collection::ref());

        abstract_block_t file = makeFile();

        std::string DECLARATOR_NO_IMPORT_STD = utils::toUpperCase(utils::getEnv("DECLARATOR_NO_IMPORT_STD"));

        std::vector<generator::ts::import_block_t> importBlocks;

        if (DECLARATOR_NO_IMPORT_STD == "TRUE" || DECLARATOR_NO_IMPORT_STD == "ON" || DECLARATOR_NO_IMPORT_STD == "YES")
        {
            importBlocks = getImports("");
        }
        else
        {
            importBlocks = getImports(stdImportSignatures);
        }

        importBlocks = getImports(getEnv("DECLARATOR_IMPORT"), importBlocks);

        for (const auto& it : getSuitableItems(Collection::ref()))
        {
            file = analyze(it, typeMapper, importBlocks, file);
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

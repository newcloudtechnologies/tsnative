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

#pragma once

#include <memory>
#include <string>

namespace generator
{

namespace print
{

struct PrinterTraits
{
    std::string Tab = "  ";
    std::string NewLine = "\n";
};

const PrinterTraits PT_preset1 = {"  ", "\n"};
const PrinterTraits PT_preset2 = {"    ", "\n"};
const PrinterTraits PT_preset3 = {"\t", "\n"};
const PrinterTraits PT_preset4 = {"\t", "\r\n"};

class AbstractSheet;
typedef std::shared_ptr<AbstractSheet> sheet_t;

class AbstractSheet
{
public:
    virtual ~AbstractSheet() = default;

    virtual void render(const std::string& img) = 0;

    static sheet_t makeFromFile(const std::string& filename);
    static sheet_t makeFromStdOut();
};

class Printer;
typedef std::shared_ptr<Printer> printer_t;

class Printer
{
private:
    PrinterTraits m_traits;
    sheet_t m_sheet;
    int m_tabulator = 0;
    int m_enterMarks = false;

private:
    Printer(const PrinterTraits& traits, sheet_t sheet);

public:
    void tab();
    void backspace();
    void enter();
    void print(const std::string& text);

    static printer_t make(const PrinterTraits& traits, sheet_t sheet);
};

template <template <typename, typename> typename Container, typename T, typename A>
void print_blocks(const Container<T, A>& blocks, generator::print::printer_t printer)
{
    for (const auto& it : blocks)
    {
        it->print(printer);
    }

    if (!blocks.empty())
    {
        printer->enter();
    }
}

} // namespace print
} // namespace generator

/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#include "Printer.h"
#include "utils/Exception.h"

#include <fstream>
#include <iostream>

namespace generator
{
namespace print
{

class FileSheet : public AbstractSheet
{
    std::ofstream m_file;

public:
    FileSheet(const std::string& filename)
        : m_file(filename, std::ios::out | std::ios::binary)
    {
    }

    void render(const std::string& img) override
    {
        m_file.write(img.c_str(), img.size());
        m_file.flush();
    }
};

class StdOutSheet : public AbstractSheet
{
public:
    StdOutSheet()
    {
    }

    void render(const std::string& img) override
    {
        std::cout.write(img.c_str(), img.size());
        std::cout.flush();
    }
};

//------------------------------------------------------------------------------------

sheet_t AbstractSheet::makeFromFile(const std::string& filename)
{
    _ASSERT(!filename.empty());
    return std::make_shared<FileSheet>(filename);
}

sheet_t AbstractSheet::makeFromStdOut()
{
    return std::make_shared<StdOutSheet>();
}

//------------------------------------------------------------------------------------

Printer::Printer(const PrinterTraits& traits, sheet_t sheet)
    : m_traits(traits)
    , m_sheet(sheet)
{
}

void Printer::tab()
{
    m_tabulator++;
}

void Printer::backspace()
{
    _ASSERT(--m_tabulator >= 0);

    // clear all new lines except one
    // after backspace generator usually prints scope closing symbol (for example "}")
    // so we need only one new line to output this symbol
    if (m_enterMarks > 0)
    {
        m_enterMarks = 1;
    }
}

void Printer::enter()
{
    // encrease new line counter (do nothing here)
    // output new lines to the file on next text printing
    m_enterMarks++;
}

void Printer::print(const std::string& text)
{
    std::string img;

    // generate new lines
    if (m_enterMarks > 0)
    {
        while (m_enterMarks > 0)
        {
            m_sheet->render(m_traits.NewLine);
            --m_enterMarks;
        }
    }

    for (auto i = 0; i < m_tabulator; i++)
    {
        img += m_traits.Tab;
    }

    img += text;

    m_sheet->render(img);
}

printer_t Printer::make(const PrinterTraits& traits, sheet_t sheet)
{
    printer_t result;
    result.reset(new Printer(traits, sheet));
    return result;
}

} // namespace print

} // namespace generator

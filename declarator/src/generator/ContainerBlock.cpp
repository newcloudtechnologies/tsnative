#include "ContainerBlock.h"

#include <algorithm>

namespace generator
{

namespace ts
{

ContainerBlock::ContainerBlock(Type type, const std::string& name)
    : AbstractBlock(type, name)
{
}

void ContainerBlock::add(abstract_block_t block)
{
    block->setParent(shared_from_this());

    m_children.push_back(block);
}

void ContainerBlock::add_before(const std::string& siblingName, abstract_block_t block)
{
    block->setParent(shared_from_this());

    auto it = std::find_if(
        m_children.begin(), m_children.end(), [siblingName](auto it) { return it->name() == siblingName; });

    if (it != m_children.end())
    {
        m_children.insert(it, block);
    }
    else
    {
        m_children.push_back(block);
    }
}

std::vector<abstract_block_t> ContainerBlock::children() const
{
    return m_children;
}

void ContainerBlock::printChildImpl(int index,
                                    int size,
                                    const_abstract_block_t child,
                                    generator::print::printer_t printer) const
{
    child->print(printer);

    // don't print new line after last child
    if (index < size - 1)
    {
        printer->enter();
    }
}

void ContainerBlock::printBodyImpl(generator::print::printer_t printer) const
{
    for (auto i = 0; i < m_children.size(); i++)
    {
        printChildImpl(i, m_children.size(), m_children.at(i), printer);
    }
}

void ContainerBlock::printBody(generator::print::printer_t printer) const
{
    printer->tab();

    printBodyImpl(printer);

    printer->backspace();
}

} // namespace ts

} // namespace generator
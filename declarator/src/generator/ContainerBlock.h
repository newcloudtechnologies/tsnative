#pragma once

#include "AbstractBlock.h"

#include <memory>
#include <vector>

namespace generator
{

namespace ts
{

class ContainerBlock : public std::enable_shared_from_this<ContainerBlock>, public AbstractBlock
{
    std::vector<abstract_block_t> m_children;

protected:
    ContainerBlock(Type type, const std::string& name = "");

    // TODO: pass const m_children as argument instead size
    virtual void printChildImpl(int index,
                                int size,
                                const_abstract_block_t child,
                                generator::print::printer_t printer) const;

    void printBodyImpl(generator::print::printer_t printer) const;

    void printBody(generator::print::printer_t printer) const override;

public:
    void add(abstract_block_t block);
    void add_before(const std::string& siblingName, abstract_block_t block);
    std::vector<abstract_block_t> children() const;
};

using container_block_t = block_t<ContainerBlock>;
using const_container_block_t = block_t<const ContainerBlock>;

} // namespace ts

} // namespace generator

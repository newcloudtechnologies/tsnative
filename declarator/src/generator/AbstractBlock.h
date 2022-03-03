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

#pragma once

#include "Decorator.h"
#include "Printer.h"

#include <functional>
#include <memory>
#include <string>
#include <vector>

namespace generator
{

namespace ts
{
template <typename T>
using block_t = std::shared_ptr<T>;

class AbstractBlock;
using abstract_block_t = block_t<AbstractBlock>;
using const_abstract_block_t = block_t<const AbstractBlock>;

using block_list_t = std::vector<abstract_block_t>;
using const_block_list_t = std::vector<const_abstract_block_t>;

struct AbstractBlock
{
    typedef enum
    {
        CLASS,
        GENERIC_CLASS,
        COMMENT,
        CODE_BLOCK,
        FIELD,
        FILE,
        IMPORT,
        METHOD,
        GENERIC_METHOD,
        CLOSURE,
        COMPUTED_PROPERTY_NAME,
        INDEX_SIGNATURE,
        FUNCTION,
        GENERIC_FUNCTION,
        MODULE,
        NAMESPACE,
        ENUM,
        ENUMERATOR,
    } Type;

private:
    Type m_type;
    std::string m_name;
    decorator_list_t m_decorators;
    bool m_hasIgnore = false;

private:
    void printDecorators(generator::print::printer_t printer) const;
    void printIgnore(generator::print::printer_t printer) const;

protected:
    virtual void printHeader(generator::print::printer_t printer) const;
    virtual void printBody(generator::print::printer_t printer) const = 0;
    virtual void printFooter(generator::print::printer_t printer) const;

public:
    AbstractBlock(Type type, const std::string& name = "");
    virtual ~AbstractBlock() = default;

    Type type() const;
    std::string name() const;
    void addDecorator(decorator_t decorator);
    void setIgnore();

    void print(generator::print::printer_t printer) const;

    static bool isContainerBlock(const_abstract_block_t block);

    template <typename T, typename... Args>
    static block_t<T> make(Args&&... args)
    {
        block_t<T> result;
        result.reset(new T(std::forward<Args>(args)...));
        return result;
    }
};

std::string typeToString(AbstractBlock::Type type);

} // namespace ts

} // namespace generator
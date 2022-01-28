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

#include <memory>
#include <string>
#include <vector>

namespace parser
{

template <typename T>
using item_t = std::shared_ptr<T>;

struct AbstractItem;
using abstract_item_t = item_t<AbstractItem>;
using const_abstract_item_t = item_t<const AbstractItem>;

using item_list_t = std::vector<abstract_item_t>;
using const_item_list_t = std::vector<const_abstract_item_t>;

struct AbstractItem
{
    typedef enum
    {
        TRANSLATION_UNIT,
        NAMESPACE,
        CLASS,
        CLASS_TEMPLATE,
        ENUM,
        FUNCTION,
        FUNCTION_TEMPLATE,
        CODE_BLOCK
    } Type;

private:
    Type m_type;
    std::string m_name;
    std::string m_prefix;
    bool m_isLocal;

protected:
    AbstractItem(Type type, const std::string& name, const std::string& prefix, bool isLocal = false);

public:
    Type type() const;
    std::string name() const;
    std::string prefix() const;
    bool isLocal() const;
    void setLocal(bool isLocal);

    static bool isContainer(const_abstract_item_t item);
    static std::string getParentName(const_abstract_item_t item);

    template <typename T, typename... Args>
    static item_t<T> make(Args&&... args)
    {
        item_t<T> result;
        result.reset(new T(std::forward<Args>(args)...));
        return result;
    }

    template <typename T>
    static const auto* decl(const_abstract_item_t item)
    {
        auto specificItem = std::static_pointer_cast<T>(item);

        return specificItem->decl();
    }
};

std::string typeToString(AbstractItem::Type type);

} //  namespace parser

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

#include "MakeClass.h"
#include "ClassDetails.h"

#include "generator/AbstractBlock.h"
#include "generator/ClassBlock.h"
#include "generator/Decorator.h"

#include "parser/Annotation.h"
#include "parser/Collection.h"

#include "constants/Annotations.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <iterator>
#include <map>
#include <set>
#include <string>
#include <vector>

namespace
{

class Overloads
{
private:
    template <typename T>
    static std::map<std::string, int> frequencyMap(T&& container)
    {
        std::map<std::string, int> result;

        for (const auto& it : container)
        {
            std::string name = it->name();

            if (result.find(name) == result.end())
            {
                result[name] = 1;
            }
            else
            {
                ++result[name];
            }
        }

        return result;
    }

    template <typename T>
    static bool is_accessors(const T& container, const std::string& name)
    {
        T methods;
        std::set<std::string> values;
        std::copy_if(std::begin(container),
                     std::end(container),
                     std::back_inserter(methods),
                     [name](auto item) { return item->name() == name; });

        _ASSERT(methods.size() == 2);

        for (const auto& it : methods)
        {
            values.insert(it->accessor());
        }

        return values.find("set") != values.end() && values.find("get") != values.end();
    }

public:
    template <typename T>
    static std::vector<std::string> get(T&& container)
    {
        std::vector<std::string> result;

        for (const auto& it : frequencyMap<T>(container))
        {
            // getter and setter
            if (it.second == 2)
            {
                if (is_accessors(container, it.first))
                    continue;
            }

            if (it.second > 1)
            {
                result.push_back(it.first);
            }
        }

        return result;
    }
};

} //  namespace

namespace analyzer
{

void makeClass(parser::const_class_item_t item, const TypeMapper& typeMapper, generator::ts::container_block_t block)
{
    using namespace constants::annotations;
    using namespace generator::ts;
    using namespace parser;
    using namespace utils;

    AnnotationList annotations(getAnnotations(item->decl()));

    std::string name = (annotations.exist(TS_NAME)) ? annotations.values(TS_NAME).at(0) : item->name();

    auto classBlock = AbstractBlock::make<ClassBlock>(name, true);

    classBlock->addExtends(getExtends(item));

    for (const auto& it : getFillerFields(item))
    {
        classBlock->addField(it);
    }

    std::vector<generator::ts::method_block_t> methods = getMethods(item, typeMapper, Collection::get());

    std::vector<std::string> method_overloads = Overloads::get(methods);

    if (!method_overloads.empty())
    {
        throw Exception(R"(overloaded methods detected: "%s",  class: "%s", scope: "%s")",
                        join(method_overloads).c_str(),
                        item->name().c_str(),
                        item->prefix().c_str());
    }

    for (const auto& it : methods)
    {
        classBlock->addMethod(it);
    }

    std::vector<generator::ts::method_block_t> closures = getClosures(item, typeMapper, Collection::get());

    std::vector<std::string> closure_overloads = Overloads::get(closures);

    if (!closure_overloads.empty())
    {
        throw Exception(R"(overloaded closures detected: "%s",  class: "%s", scope: "%s")",
                        join(closure_overloads).c_str(),
                        item->name().c_str(),
                        item->prefix().c_str());
    }

    for (const auto& it : closures)
    {
        classBlock->addClosure(it);
    }

    if (annotations.exist(TS_DECORATOR))
    {
        for (const auto& it : annotations.values(TS_DECORATOR))
        {
            decorator_t decorator = Decorator::fromString(it);
            classBlock->addDecorator(decorator);
        }
    }

    if (item->hasVTable())
    {
        classBlock->addDecorator(Decorator::make("VTableSize", item->getVTableSize()));
    }

    if (item->hasVirtualDestructor())
    {
        classBlock->addDecorator(Decorator::make("VirtualDestructor"));
    }

    if (annotations.exist(TS_IGNORE))
    {
        classBlock->setIgnore();
    }

    block->add(classBlock);
}

} // namespace analyzer

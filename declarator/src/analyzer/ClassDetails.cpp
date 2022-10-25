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

#include "ClassDetails.h"
#include "InheritanceNode.h"
#include "TsUtils.h"
#include "TypeUtils.h"

#include "parser/Annotation.h"
#include "parser/Collection.h"
#include "parser/NamespaceItem.h"
#include "parser/Utils.h"

#include "global/Annotations.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <iterator>
#include <set>

namespace
{

template <typename T>
void pushBlock(typename std::vector<T>& container, T block)
{
    auto pred = [block](const T& it)
    {
        bool result = false;

        if (it->isConstructor())
        {
            return result;
        }

        if (it->name() == block->name())
        {
            if (block->accessor() == it->accessor())
            {
                result = true;
            }
        }

        return result;
    };

    auto found = std::find_if(container.begin(), container.end(), pred);

    if (found != container.end())
    {
        // replace method block if already exist
        // for example: virtual methods from base class and overridden methods in derived class
        // overridden methods have more priority
        *found = block;
    }
    else
    {
        // add new
        container.push_back(block);
    }
}

template <>
void pushBlock(typename std::vector<generator::ts::operator_block_t>& container, generator::ts::operator_block_t block)
{
    container.push_back(block);
}

} // namespace

namespace analyzer
{

ClassDetails::ClassDetails(parser::const_class_item_t item,
                           const parser::Collection& collection,
                           const TypeMapper& typeMapper)
    : m_item(item)
    , m_collection(collection)
    , m_typeMapper(typeMapper)
{
}

std::vector<parser::const_class_item_t> ClassDetails::getRetainedBases() const
{
    using namespace global::annotations;
    using namespace parser;
    using namespace analyzer;

    struct BasesCollector
    {
        static std::vector<const_class_item_t> collect(const InheritanceNode& node)
        {
            std::vector<const_class_item_t> result;

            for (const auto& it : node.bases())
            {
                AnnotationList annotations(getAnnotations(it.item()->decl()));

                if (!annotations.exist(TS_EXPORT) && !annotations.exist(TS_DECLARE))
                {
                    result.push_back(it.item());

                    std::vector<const_class_item_t> sublist = collect(it);
                    std::move(sublist.begin(), sublist.end(), std::back_inserter(result));
                }
            }

            return result;
        }
    };

    auto node = InheritanceNode::make(m_collection, m_item);

    return BasesCollector::collect(node);
}

generator::ts::abstract_method_block_t ClassDetails::makeMethod(parser::const_method_item_t item,
                                                                const std::string& className,
                                                                const std::string& classPrefix)
{
    using namespace global::annotations;
    using namespace parser;
    using namespace analyzer;
    using namespace generator::ts;

    abstract_method_block_t result;

    AnnotationList annotations(getAnnotations(item->decl()));

#ifndef NDEBUG
    std::string methodName = item->name();
#endif

    if (annotations.exist(TS_METHOD))
    {
        if (annotations.exist(TS_SIGNATURE))
        {
            TsSignature signature(annotations.values(TS_SIGNATURE).at(0));

            switch (signature.type())
            {
                case TsSignature::Type::METHOD:
                {
                    auto block =
                        (item->isConstructor())
                            ? AbstractBlock::make<MethodBlock>()
                            : AbstractBlock::make<MethodBlock>(signature.name(), signature.retType(), item->isStatic());

                    block->setAccessor(signature.accessor());

                    for (const auto& it : signature.arguments())
                    {
                        block->addArgument({it.name, it.type, it.isSpread, it.isOptional});
                    }

                    result = block;

                    break;
                }
                case TsSignature::Type::GENERIC_METHOD:
                {
                    auto block = (item->isConstructor()) ? AbstractBlock::make<GenericMethodBlock>()
                                                         : AbstractBlock::make<GenericMethodBlock>(
                                                               signature.name(), signature.retType(), item->isStatic());

                    block->setAccessor(signature.accessor());

                    for (const auto& it : signature.arguments())
                    {
                        block->addArgument({it.name, it.type, it.isSpread, it.isOptional});
                    }

                    for (const auto& it : signature.templateArguments())
                    {
                        block->addTemplateArgument(it);
                    }

                    result = block;

                    break;
                }
                case TsSignature::Type::COMPUTED_PROPERTY_NAME:
                {
                    auto block = AbstractBlock::make<ComputedPropertyNameBlock>(signature.name(), signature.retType());
                    result = block;
                    break;
                }
                case TsSignature::Type::INDEX_SIGNATURE:
                {
                    _ASSERT(signature.arguments().size() == 1);
                    auto arg = signature.arguments().at(0);
                    std::string retType = signature.retType();

                    auto block = AbstractBlock::make<IndexSignatureBlock>(retType);
                    block->setArgument({arg.name, arg.type});
                    result = block;
                    break;
                }
                default:
                {
                    throw utils::Exception(
                        R"(incorrect signature type: available types: 
                        [METHOD, GENERIC_METHOD, COMPUTED_PROPERTY_NAME, INDEX_SIGNATURE];
                        Method: "%s", scope: "%s", class: "%s", signature: "%s")",
                        item->name().c_str(),
                        className.c_str(),
                        classPrefix.c_str(),
                        annotations.values(TS_SIGNATURE).at(0).c_str());
                }
            };
        }
        else
        {
            std::string name = annotations.exist(TS_NAME) ? annotations.values(TS_NAME).at(0) : item->name();

            std::string retType = annotations.exist(TS_RETURN_TYPE)
                                      ? annotations.values(TS_RETURN_TYPE).at(0)
                                      : m_typeMapper.convertToTSType(classPrefix, item->returnType());

            auto block = (item->isConstructor()) ? AbstractBlock::make<MethodBlock>()
                                                 : AbstractBlock::make<MethodBlock>(name, retType, item->isStatic());

            if (annotations.exist(TS_GETTER))
            {
                block->setAccessor("get");
            }
            else if (annotations.exist(TS_SETTER))
            {
                block->setAccessor("set");
            }

            for (const auto& it : item->parameters())
            {
                std::string type = m_typeMapper.convertToTSType(classPrefix, it.type());
                block->addArgument({it.name(), type});
            }

            result = block;
        }

        if (annotations.exist(TS_DECORATOR))
        {
            for (const auto& it : annotations.values(TS_DECORATOR))
            {
                decorator_t decorator = Decorator::fromString(it);
                result->addDecorator(decorator);
            }
        }

        if (annotations.exist(TS_IGNORE))
        {
            result->setIgnore();
        }

        int vtableIndex = item->getVTableIndex();
        if (vtableIndex > -1)
        {
            result->addDecorator(Decorator::make("VTableIndex", vtableIndex));
        }
    }
    else if (annotations.exist(TS_CLOSURE))
    {
        std::string name = annotations.exist(TS_NAME) ? annotations.values(TS_NAME).at(0) : item->name();

        auto block = AbstractBlock::make<ClosureBlock>(name);

        for (const auto& it : item->parameters())
        {
            block->addArgument({it.name(), "TSClosure"});
        }

        result = block;
    }

    return result;
}

void ClassDetails::generateExtends()
{
    using namespace utils;
    using namespace parser;
    using namespace global::annotations;

    struct BasesCollector
    {
        static std::vector<std::string> collect(const InheritanceNode& node)
        {
            std::vector<std::string> result;

            for (const auto& it : node.bases())
            {
                AnnotationList annotations(getAnnotations(it.item()->decl()));

                // collect all annotated classes
                if (annotations.exist(TS_EXPORT) || annotations.exist(TS_DECLARE))
                {
                    result.push_back(getFullTypeName(it.item()->prefix(), it.actualTypeName()));
                }

                std::vector<std::string> sublist = collect(it);
                std::move(sublist.begin(), sublist.end(), std::back_inserter(result));
            }

            return result;
        }
    };

    std::vector<std::string> bases = BasesCollector::collect(InheritanceNode::make(Collection::ref(), m_item));

    // TODO: the crutch: remove standard class "Object" from inheritance list
    bases.erase(std::remove(bases.begin(), bases.end(), "Object"), bases.end());

    if (!bases.empty())
    {
        extends = m_typeMapper.convertToTSType(m_item->prefix(), bases.at(0));
    }
}

void ClassDetails::generateAllMethods()
{
    // items from base classes first
    for (const auto& it : getRetainedBases())
    {
        generateMethods(it);
    }

    // own items next
    generateMethods(m_item);
}

void ClassDetails::generateMethods(parser::const_class_item_t item)
{
    for (const auto& it : item->methods())
    {
        generateMethod(it);
    }

    for (const auto& it : item->templateMethods())
    {
        generateMethod(it);
    }
}

void ClassDetails::generateMethod(parser::const_method_item_t item)
{
    using namespace generator::ts;

    auto abstractMethodBlock = makeMethod(item, m_item->name(), m_item->prefix());

    if (abstractMethodBlock)
    {
        switch (abstractMethodBlock->type())
        {
            case AbstractBlock::Type::METHOD:
            {
                auto methodBlock = std::static_pointer_cast<MethodBlock>(abstractMethodBlock);
                pushBlock(methods, methodBlock);
                break;
            }
            case AbstractBlock::Type::GENERIC_METHOD:
            {
                auto genericMethodBlock = std::static_pointer_cast<GenericMethodBlock>(abstractMethodBlock);
                pushBlock(generic_methods, genericMethodBlock);
                break;
            }
            case AbstractBlock::Type::CLOSURE:
            {
                auto closureBlock = std::static_pointer_cast<ClosureBlock>(abstractMethodBlock);
                pushBlock(closures, closureBlock);
                break;
            }
            case AbstractBlock::Type::COMPUTED_PROPERTY_NAME:
            case AbstractBlock::Type::INDEX_SIGNATURE:
            {
                auto operatorBlock = std::static_pointer_cast<OperatorBlock>(abstractMethodBlock);
                pushBlock(operators, operatorBlock);
                break;
            }
            default:
            {
                throw utils::Exception(R"(unsupported block type: name "%s", type: "%s")",
                                       abstractMethodBlock->name().c_str(),
                                       typeToString(abstractMethodBlock->type()).c_str());
            }
        };
    }
}

ClassDetails ClassDetails::make(parser::const_class_item_t item,
                                const parser::Collection& collection,
                                const TypeMapper& typeMapper)
{
    ClassDetails result(item, collection, typeMapper);
    result.generateExtends();
    result.generateAllMethods();

    return result;
}

parser::const_class_item_t ClassDetails::item() const
{
    return m_item;
}

const parser::Collection& ClassDetails::collection() const
{
    return m_collection;
}

} // namespace analyzer

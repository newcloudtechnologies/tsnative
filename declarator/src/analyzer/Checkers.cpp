#include "Checkers.h"
#include "TsUtils.h"

#include "global/Annotations.h"

#include "parser/Annotation.h"
#include "parser/ClassTemplateItem.h"
#include "parser/Collection.h"
#include "parser/ContainerItem.h"
#include "parser/FunctionTemplateItem.h"

#include "utils/Exception.h"
#include "utils/Strings.h"

#include <clang/AST/QualTypeNames.h>
#include <clang/AST/Type.h>

#include <algorithm>
#include <functional>
#include <map>
#include <set>

namespace
{

class OverloadDetector
{
    template <typename T>
    struct identity
    {
        typedef T type;
    };

private:
    template <typename T>
    static std::string itemName(T item)
    {
        using namespace global::annotations;
        using namespace parser;
        using namespace utils;
        using namespace analyzer;

        std::string result;
        AnnotationList annotations(getAnnotations(item->decl()));

        if (annotations.exist(TS_NAME))
        {
            result = annotations.values(TS_NAME).at(0);
        }
        else if (annotations.exist(TS_SIGNATURE))
        {
            TsSignature signature(annotations.values(TS_SIGNATURE).at(0));
            result = signature.name();
        }
        else
        {
            result = item->name();
        }

        return result;
    }

    template <template <typename, typename> typename C, typename T, typename A>
    static std::map<std::string, int> frequencyMap(const C<T, A>& container)
    {
        using namespace global::annotations;
        using namespace parser;

        std::map<std::string, int> result;

        for (const auto& it : container)
        {
            std::string name = itemName(it);

            AnnotationList annotations(getAnnotations(it->decl()));

            if (annotations.exist(TS_NO_CHECK))
                continue;

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

    template <template <typename, typename> typename C, typename T, typename A>
    static bool checkAccessorPair(const C<T, A>& container,
                                  const std::string& name,
                                  typename identity<std::function<bool(T, T)>>::type is_accessors_pair)
    {
        bool result = false;

        C<T, A> methods;

        std::copy_if(std::begin(container),
                     std::end(container),
                     std::back_inserter(methods),
                     [name](const auto& item) { return itemName(item) == name; });

        if (methods.size() == 2)
        {
            result = is_accessors_pair(methods.at(0), methods.at(1));
        }

        return result;
    }

public:
    // Pass container with method/function items to detect if overload happened.
    // Handler is_accessors_pair checks whether a pair of items are accessors or not.
    template <template <typename, typename> typename C, typename T, typename A>
    static std::vector<std::string> get(
        const C<T, A>& container,
        typename identity<std::function<bool(T, T)>>::type is_accessors_pair = [](T, T) { return false; })
    {
        std::vector<std::string> result;

        for (const auto& it : frequencyMap(container))
        {
            const std::string& name = it.first;
            const int& amount = it.second;

            // getter and setter
            if (amount == 2 && checkAccessorPair(container, name, is_accessors_pair))
            {
                continue;
            }

            if (amount > 1)
            {
                result.push_back(name);
            }
        }

        return result;
    }
};

// Example:
// template <typename T> class MyClass {
// ...
// T* someMethod() { ... }
// void anotherMethod(T* arg) { ... }
// };
// item - class template (or function template) declaration
// type - type to check (return type or argument type)
template <typename T>
bool isTypeTemplated(T item, clang::QualType type)
{
    using namespace analyzer;

    const auto& templateParameters = item->templateParameters();
    std::string refinedType = typeToString(removeCVPR(type));

    // type name is the same as one of template parameter
    auto found = std::find_if(std::begin(templateParameters),
                              std::end(templateParameters),
                              [refinedType](const auto& it) { return refinedType == it.name(); });

    return found != std::end(templateParameters);
}

} // namespace

namespace analyzer
{

void TypeChecker::check(const clang::QualType& type,
                        const clang::ASTContext& context,
                        std::function<std::string()> where)
{
    using namespace parser;
    using namespace utils;

    const auto& collection = Collection::ref();
    std::string typeName = typeToString(type);
    std::string refinedTypeName = typeToString(removeCVPR(type), context);

    auto notAPointer = [&context](const clang::QualType& type)
    {
        bool result = false;

        const auto& collection = Collection::ref();
        std::string path = typeToString(removeCVPR(type), context);

        std::optional<const_abstract_item_t> item = collection.findItem(path);
        if (item.has_value())
        {
            result = (*item)->type() == parser::AbstractItem::Type::ENUM;
        }

        return result;
    };

    if (typeName != "void" && !isPointer(type))
    {
        if (!notAPointer(type))
        {
            throw Exception(R"(type: "%s" should be a pointer: [%s])", typeName.c_str(), where().c_str());
        }
    }

    if (refinedTypeName != "void")
    {
        std::optional<const_abstract_item_t> item = collection.findItem(refinedTypeName);
        if (item.has_value())
        {
            auto itemType = (*item)->type();

            if (itemType == AbstractItem::Type::CLASS || itemType == AbstractItem::Type::CLASS_TEMPLATE ||
                itemType == AbstractItem::Type::CLASS_TEMPLATE_SPECIALIZATION)
            {
                auto classItem = std::static_pointer_cast<ClassItem const>(*item);
                auto node = InheritanceNode::make(collection, classItem);
                InheritanceChecker::check(node);
            }
        }
        else
        {
            throw Exception(
                R"(type: "%s", is not found in collection: [%s])", refinedTypeName.c_str(), where().c_str());
        }
    }
}

InheritanceChecker::InheritanceChecker(const InheritanceNode& node)
{
    using namespace global::annotations;
    using namespace parser;

    AnnotationList annotations(getAnnotations(node.item()->decl()));

    // class Object has himself :-)
    if (annotations.exist(TS_NO_CHECK) || node.actualTypeName() == "Object" || !node.item()->isCompletedDecl())
    {
        hasObject = true;
    }
    else
    {
        hasObject = lookupObject(node.bases());
    }

    objectInheritors = lookupObjectInheritors(node);
}

bool InheritanceChecker::lookupObject(const std::vector<InheritanceNode>& bases)
{
    bool result = false;

    // class Object must be a first of bases
    if (!bases.empty())
    {
        InheritanceNode firstBase = bases.at(0);

        if (firstBase.actualTypeName() == "Object")
        {
            result = true;
        }
        else
        {
            result = lookupObject(firstBase.bases());
        }
    }

    return result;
}

void InheritanceChecker::collectObjectInheritors(const InheritanceNode& node,
                                                 const InheritanceNode& base,
                                                 std::vector<std::string>& objectInheritors)
{
    // check if base of node is Object
    if (base.actualTypeName() == "Object")
    {
        objectInheritors.push_back(node.fullActualTypeName());
    }

    for (const auto& it : base.bases())
    {
        collectObjectInheritors(base, it, objectInheritors);
    }
}

std::vector<std::string> InheritanceChecker::lookupObjectInheritors(const InheritanceNode& node)
{
    std::vector<std::string> objectInheritors;

    for (const auto& it : node.bases())
    {
        collectObjectInheritors(node, it, objectInheritors);
    }

    std::sort(objectInheritors.begin(), objectInheritors.end());

    objectInheritors.erase(std::unique(objectInheritors.begin(), objectInheritors.end()), objectInheritors.end());

    return objectInheritors;
}

void InheritanceChecker::check(const InheritanceNode& node)
{
    using namespace utils;

    InheritanceChecker checker(node);

    if (!checker.hasObject)
    {
        throw Exception(R"(class: "%s" must be inherited "Object" first)", node.fullActualTypeName().c_str());
    }

    if (checker.objectInheritors.size() > 1)
    {
        throw Exception(R"(class: "%s", multiple inherits class "Object". Inheritors: %s)",
                        node.fullActualTypeName().c_str(),
                        utils::print(checker.objectInheritors).c_str());
    }
}

void InheritanceChecker::check(parser::const_class_item_t item)
{
    using namespace parser;

    const auto& collection = Collection::ref();

    auto node = InheritanceNode::make(collection, item);

    check(node);
}

void ClassChecker::overloads(parser::const_class_item_t item)
{
    using namespace global::annotations;
    using namespace parser;
    using namespace utils;

    enum class AccessorType
    {
        NOTHING,
        GETTER,
        SETTER
    };

    auto get_accessor = [](const_method_item_t method)
    {
        AccessorType result = AccessorType::NOTHING;

        AnnotationList annotations{getAnnotations(method->decl())};

        if (annotations.exist(TS_SIGNATURE))
        {
            TsSignature signature(annotations.values(TS_SIGNATURE).at(0));
            result = signature.accessor() == "get"   ? AccessorType::GETTER
                     : signature.accessor() == "set" ? AccessorType::SETTER
                                                     : AccessorType::NOTHING;
        }
        else
        {
            result = annotations.exist(TS_GETTER)   ? AccessorType::GETTER
                     : annotations.exist(TS_SETTER) ? AccessorType::SETTER
                                                    : AccessorType::NOTHING;
        }

        return result;
    };

    auto is_accessors_pair = [get_accessor](const_method_item_t a, const_method_item_t b)
    {
        std::set<AccessorType> accessors{get_accessor(a), get_accessor(b)};

        return accessors.find(AccessorType::GETTER) != accessors.end() &&
               accessors.find(AccessorType::SETTER) != accessors.end();
    };

    method_item_list_t methods;
    method_item_list_t generic_methods;

    // sort method items
    for (const auto& it : item->methods())
    {
        AnnotationList annotations(getAnnotations(it->decl()));

        if (annotations.exist(TS_METHOD))
        {
            if (std::dynamic_pointer_cast<TemplateMethodItem const>(it))
            {
                generic_methods.push_back(it);
            }
            else
            {
                methods.push_back(it);
            }
        }
    }

    std::vector<std::string> method_overloads = OverloadDetector::get(methods, is_accessors_pair);
    if (!method_overloads.empty())
    {
        throw Exception(R"(overloaded methods detected: "%s",  class: "%s", scope: "%s")",
                        join(method_overloads).c_str(),
                        item->name().c_str(),
                        item->prefix().c_str());
    }

    std::vector<std::string> generic_method_overloads = OverloadDetector::get(generic_methods, is_accessors_pair);
    if (!generic_method_overloads.empty())
    {
        throw Exception(R"(overloaded generic methods detected: "%s",  class: "%s", scope: "%s")",
                        join(generic_method_overloads).c_str(),
                        item->name().c_str(),
                        item->prefix().c_str());
    }
}

void ClassChecker::types(parser::const_class_item_t item)
{
    using namespace global::annotations;
    using namespace parser;
    using namespace utils;

    // iterate methods
    for (const auto& it : item->methods())
    {
        AnnotationList annotations(getAnnotations(it->decl()));

        if (annotations.exist(TS_METHOD) && !annotations.exist(TS_NO_CHECK))
        {
            auto where = [className = item->name(), prefix = item->prefix(), methodName = it->name()]()
            {
                return utils::strprintf(
                    R"(class: %s, prefix: %s, method: %s)", className.c_str(), prefix.c_str(), methodName.c_str());
            };

            for (const auto& it_p : it->parameters())
            {
                if (!it_p.isTemplated())
                {
                    TypeChecker::check(it_p.type(), it_p.decl()->getASTContext(), where);
                }
            }

            if (item->type() == AbstractItem::Type::CLASS_TEMPLATE)
            {
                auto classTemplateItem = std::static_pointer_cast<ClassTemplateItem const>(item);

                if (!isTypeTemplated(classTemplateItem, it->returnType()))
                {
                    TypeChecker::check(it->returnType(), it->decl()->getASTContext(), where);
                }
            }
            else
            {
                TypeChecker::check(it->returnType(), it->decl()->getASTContext(), where);
            }
        }
    }
}

void ClassChecker::check(parser::const_class_item_t item)
{
    overloads(item);
    types(item);
}

void FunctionChecker::overloads(parser::const_function_item_t item, const std::string& name)
{
    using namespace global::annotations;
    using namespace parser;
    using namespace utils;

    const auto& collection = Collection::ref();

    std::string scopeName = item->prefix();

    // functionType could be AbstractItem::Type::FUNCTION or AbstractItem::Type::FUNCTION_TEMPLATE
    auto get_overloads = [](const item_list_t& children, AbstractItem::Type functionType)
    {
        using namespace parser;

        item_list_t items;
        function_item_list_t functions;

        std::copy_if(std::begin(children),
                     std::end(children),
                     std::back_inserter(items),
                     [functionType](auto item)
                     {
                         bool result = false;
                         auto type = item->type();

                         if (type == functionType)
                         {
                             auto functionItem = std::static_pointer_cast<FunctionItem const>(item);
                             AnnotationList annotations(getAnnotations(functionItem->decl()));
                             result = annotations.exist("TS_EXPORT") || annotations.exist("TS_DECLARE");
                         }

                         return result;
                     });

        std::transform(items.begin(),
                       items.end(),
                       std::back_inserter(functions),
                       [](auto item)
                       {
                           _ASSERT(item->type() == AbstractItem::Type::FUNCTION ||
                                   item->type() == AbstractItem::Type::FUNCTION_TEMPLATE);
                           return std::static_pointer_cast<FunctionItem>(item);
                       });

        return OverloadDetector::get(functions);
    };

    std::optional<const_abstract_item_t> scope = collection.findItem(scopeName);
    if (scope.has_value())
    {
        _ASSERT(AbstractItem::isContainer(*scope));

        const auto containerItem = std::static_pointer_cast<const ContainerItem>(*scope);

        item_list_t children = containerItem->children();

        std::vector<std::string> overloads = get_overloads(children, AbstractItem::Type::FUNCTION);

        if (!overloads.empty())
        {
            throw utils::Exception(R"(overloaded functions with names %s detected in scope "%s")",
                                   utils::print(overloads).c_str(),
                                   scopeName.c_str());
        }

        overloads = get_overloads(children, AbstractItem::Type::FUNCTION_TEMPLATE);

        if (!overloads.empty())
        {
            throw utils::Exception(R"(overloaded template functions with names %s detected in scope "%s")",
                                   utils::print(overloads).c_str(),
                                   scopeName.c_str());
        }
    }
    else
    {
        throw Exception(R"(scope: "%s", is not found in collection)", scopeName.c_str());
    }
}

void FunctionChecker::types(parser::const_function_item_t item)
{
    using namespace parser;

    auto where_func = [functionName = item->name(), prefix = item->prefix()]()
    { return utils::strprintf(R"(function: %s, prefix: %s)", functionName.c_str(), prefix.c_str()); };

    for (const auto& it : item->parameters())
    {
        // skip parameters with template types
        if (!it.isTemplated())
        {
            auto where_arg = [where_func, argName = it.name()]()
            { return utils::strprintf(R"(%s, arg: %s)", where_func().c_str(), argName.c_str()); };

            TypeChecker::check(it.type(), it.decl()->getASTContext(), where_arg);
        }
    }

    auto where_ret = [where_func]() { return utils::strprintf(R"(%s, return value)", where_func().c_str()); };

    if (item->type() == AbstractItem::Type::FUNCTION_TEMPLATE)
    {
        auto functionTemplateItem = std::static_pointer_cast<FunctionTemplateItem const>(item);

        if (!isTypeTemplated(functionTemplateItem, item->returnType()))
        {
            TypeChecker::check(item->returnType(), item->decl()->getASTContext(), where_ret);
        }
    }
    else
    {
        TypeChecker::check(item->returnType(), item->decl()->getASTContext(), where_ret);
    }
}

void FunctionChecker::check(parser::const_function_item_t item)
{
    check(item, item->name());
}

void FunctionChecker::check(parser::const_function_item_t item, const std::string& name)
{
    overloads(item, name);
    types(item);
}

} // namespace analyzer

cmake_minimum_required(VERSION 3.12)
project(parser LANGUAGES CXX)

set(INCLUDES
    Collection.h
    Diagnostics.h
    TranslationUnit.h
    Annotation.h
    Visitor.h
    AbstractItem.h
    ContainerItem.h
    NamespaceItem.h
    ParameterValue.h
    TemplateInstantiator.h
    TemplateParameterValue.h
    ClassItem.h
    ClassTemplateItem.h
    ClassTemplateSpecializationItem.h
    EnumItem.h
    FunctionItem.h
    FunctionTemplateItem.h
    MethodItem.h
    FieldItem.h
    TemplateMethodItem.h
    CodeBlockItem.h
    VariableItem.h
    Utils.h
)

set(SOURCES
    Collection.cpp
    Diagnostics.cpp
    TranslationUnit.cpp
    Annotation.cpp
    Visitor.cpp
    AbstractItem.cpp
    ContainerItem.cpp
    NamespaceItem.cpp
    ParameterValue.cpp
    TemplateInstantiator.cpp
    TemplateParameterValue.cpp
    ClassItem.cpp
    ClassTemplateItem.cpp
    ClassTemplateSpecializationItem.cpp
    EnumItem.cpp
    FunctionItem.cpp
    FunctionTemplateItem.cpp
    MethodItem.cpp
    FieldItem.cpp
    TemplateMethodItem.cpp
    CodeBlockItem.cpp
    VariableItem.cpp
    Utils.cpp
)

add_library(${PROJECT_NAME} OBJECT
    ${INCLUDES}
    ${SOURCES}
)

target_link_libraries(${PROJECT_NAME} PRIVATE global utils)

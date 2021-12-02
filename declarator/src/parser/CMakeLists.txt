#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
# 
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
# 
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

cmake_minimum_required(VERSION 3.12)
project(parser LANGUAGES CXX)

set(INCLUDES
    Collection.h
    TranslationUnit.h
    Annotation.h
    AbstractItem.h
    ContainerItem.h
    NamespaceItem.h
    ParameterValue.h
    TemplateParameterValue.h
    ClassItem.h
    ClassTemplateItem.h
    EnumItem.h
    FunctionItem.h
    MethodItem.h
    TemplateMethodItem.h
)

set(SOURCES
    Collection.cpp
    TranslationUnit.cpp
    Annotation.cpp
    AbstractItem.cpp
    ContainerItem.cpp
    NamespaceItem.cpp
    ParameterValue.cpp
    TemplateParameterValue.cpp
    ClassItem.cpp
    ClassTemplateItem.cpp
    EnumItem.cpp
    FunctionItem.cpp
    MethodItem.cpp
    TemplateMethodItem.cpp
)

add_library(${PROJECT_NAME} OBJECT
    ${INCLUDES}
    ${SOURCES}
)

target_link_libraries(${PROJECT_NAME})

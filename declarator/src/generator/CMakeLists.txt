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
project(generator LANGUAGES CXX)

set(INCLUDES
    Utils.h
    Printer.h
    Decorator.h
    AbstractBlock.h
    ContainerBlock.h
    ModuleBlock.h
    NamespaceBlock.h
    EnumBlock.h
    ClassBlock.h
    FieldBlock.h
    MethodBlock.h
    ElementAccessExpressionBlock.h
    CommentBlock.h
    FunctionDetails.h
    ClassDetails.h
    FunctionBlock.h
    FileBlock.h
    ImportBlock.h
)

set(SOURCES
    Utils.cpp
    Printer.cpp
    Decorator.cpp
    AbstractBlock.cpp
    ContainerBlock.cpp
    ModuleBlock.cpp
    NamespaceBlock.cpp
    EnumBlock.cpp
    ClassBlock.cpp
    FieldBlock.cpp
    MethodBlock.cpp
    ElementAccessExpressionBlock.cpp
    CommentBlock.cpp
    FunctionDetails.cpp
    ClassDetails.cpp
    FunctionBlock.cpp
    FileBlock.cpp
    ImportBlock.cpp
)

add_library(${PROJECT_NAME} OBJECT
    ${INCLUDES}
    ${SOURCES}
)

target_link_libraries(${PROJECT_NAME} PRIVATE utils)

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
    Ignore.h
    AbstractBlock.h
    ContainerBlock.h
    ModuleBlock.h
    NamespaceBlock.h
    EnumBlock.h
    ClassBlock.h
    GenericClassBlock.h
    FieldBlock.h
    AbstractMethodBlock.h
    MethodBlock.h
    GenericMethodBlock.h
    OperatorBlock.h
    ComputedPropertyNameBlock.h
    IndexSignatureBlock.h
    CommentBlock.h
    CodeBlock.h
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
    Ignore.cpp
    AbstractBlock.cpp
    ContainerBlock.cpp
    ModuleBlock.cpp
    NamespaceBlock.cpp
    EnumBlock.cpp
    ClassBlock.cpp
    GenericClassBlock.cpp
    FieldBlock.cpp
    AbstractMethodBlock.cpp
    MethodBlock.cpp
    GenericMethodBlock.cpp
    OperatorBlock.cpp
    ComputedPropertyNameBlock.cpp
    IndexSignatureBlock.cpp
    CommentBlock.cpp
    CodeBlock.cpp
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

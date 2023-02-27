#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2023
# 
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
# 
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

cmake_minimum_required(VERSION 3.12)
project(analyzer LANGUAGES CXX)

set(INCLUDES
    Analyzer.h
    Annotation.h
    InheritanceNode.h
    ClassDetails.h
    MakeNamespace.h
    MakeClass.h
    MakeGenericClass.h
    MakeEnum.h
    MakeFunction.h
    MakeCodeBlock.h
    TypeUtils.h
    TsUtils.h
    Checkers.h
)

set(SOURCES
    Analyzer.cpp
    Annotation.cpp
    InheritanceNode.cpp
    ClassDetails.cpp
    MakeNamespace.cpp
    MakeClass.cpp
    MakeGenericClass.cpp
    MakeEnum.cpp
    MakeFunction.cpp
    MakeCodeBlock.cpp
    TypeUtils.cpp
    TsUtils.cpp
    Checkers.cpp
)

add_library(${PROJECT_NAME} OBJECT
    ${INCLUDES}
    ${SOURCES}
)

target_link_libraries(${PROJECT_NAME} PRIVATE parser generator global utils)

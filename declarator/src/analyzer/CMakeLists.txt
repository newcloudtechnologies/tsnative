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

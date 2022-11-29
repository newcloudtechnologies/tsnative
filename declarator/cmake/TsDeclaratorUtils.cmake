#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2022
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

message(STATUS "Found TsDeclaratorUtils in ${CMAKE_CURRENT_LIST_DIR}")

define_property(TARGET PROPERTY TS_NO_IMPORT_STD
    BRIEF_DOCS "Whether or not import std"
    FULL_DOCS "Whether or not import std [true/false]"
)

macro (_find_program VAR NAME)
    if(${CMAKE_VERSION} VERSION_LESS "3.18.0")
        find_program(${VAR} ${NAME})
        if (NOT ${VAR})
            message(FATAL_ERROR "${NAME} not found")
        endif()
    else()
        find_program(${VAR} ${NAME} REQUIRED)
    endif()
endmacro()

_find_program(TS_DECLARATOR tsnative-declarator)
_find_program(TS_INDEXER tsnative-indexer.py)

message(STATUS "Found TS_DECLARATOR: ${TS_DECLARATOR}")
message(STATUS "Found TS_INDEXER: ${TS_INDEXER}")

macro (_requiredArgs ...)
    foreach(arg ${ARGV})
        if (NOT DEFINED ${arg})
            string(REPLACE ARG_ "" arg ${arg})
            message(FATAL_ERROR "Missing required argument: ${arg}")
        endif()
    endforeach()
endmacro()

macro (_nonEmptyArgs ...)
    foreach(arg ${ARGV})
        if ("${${arg}}" STREQUAL "")
            string(REPLACE ARG_ "" arg ${arg})
            message(FATAL_ERROR "Missing value for argument: ${arg}")
        endif()
    endforeach()
endmacro()

### Recursively populates c++ include directories from target
### Args:
# TARGET - given target
# [OUT] INCLUDE_LIST - list of include directories
function(get_target_includes TARGET INCLUDE_LIST)
    set(result )

    if (${TARGET} IN_LIST processed_targets)
        #message(STATUS "Target ${TARGET} exist in ${processed_targets}")
        return()
    else()
        set(processed_targets "${processed_targets};${TARGET}")
    endif()

    get_target_property(includes ${TARGET} INTERFACE_INCLUDE_DIRECTORIES)
    list(FILTER includes EXCLUDE REGEX ".*[-]NOTFOUND")
    list(APPEND result ${includes})

    get_target_property(libraries ${TARGET} INTERFACE_LINK_LIBRARIES)

    foreach(item ${libraries})
        if (TARGET ${item})
            set(out_list )
            get_target_includes(${item} out_list)
            list(APPEND result ${out_list})
        endif()
    endforeach()

    list(REMOVE_DUPLICATES result)

    set(${INCLUDE_LIST} ${result} PARENT_SCOPE)
    set(processed_targets "${processed_targets};${TARGET}" PARENT_SCOPE)
endfunction()


function(run_declarator2 NAME ...)
    set(options )
    set(oneValueArgs SOURCE DEST TARGET_COMPILER_ABI IGNORE_ERROR IMPORT NO_IMPORT_STD TEMP_DIR NO_HEAD)
    set(multiValueArgs )

    cmake_parse_arguments(PARSE_ARGV 1 "ARG" "${options}" "${oneValueArgs}" "${multiValueArgs}")

    if (DEFINED ARG_UNPARSED_ARGUMENTS)
        message(FATAL_ERROR "You have unparsed arguments: '${ARG_UNPARSED_ARGUMENTS}'")
    endif()

    _requiredArgs(ARG_SOURCE ARG_DEST ARG_TARGET_COMPILER_ABI ARG_NO_IMPORT_STD)
    _nonEmptyArgs(ARG_TARGET_COMPILER_ABI ARG_OUTPUT_DIR)

    set(sysroot )
    set(envVariables )
    set(abi         ${ARG_TARGET_COMPILER_ABI})
    set(inputFile   ${ARG_SOURCE})
    set(outputFile  ${ARG_DEST})
    set(includeDirs )
    set(tsStd       tsnative-std::tsnative-std)

    set(outputDir )
    get_filename_component(outputDir ${outputFile} DIRECTORY)

    # Vars will be quoted properly if needed bc of VERBATIM in command invocation.
    list(APPEND envVariables DECLARATOR_OUTPUT_DIR=${outputDir})
    list(APPEND envVariables DECLARATOR_TEMP_DIR=${ARG_TEMP_DIR})
    # These vars are empty usually so do not trash command
    list(APPEND envVariables $<$<BOOL:${ARG_IMPORT}>:DECLARATOR_IMPORT=$<JOIN:${ARG_IMPORT},\\\;>>)
    list(APPEND envVariables $<$<BOOL:${ARG_NO_IMPORT_STD}>:DECLARATOR_NO_IMPORT_STD=${ARG_NO_IMPORT_STD}>)
    list(APPEND envVariables $<$<BOOL:${ARG_NO_HEAD}>:DECLARATOR_NO_HEAD=${ARG_NO_HEAD}>)

    list(APPEND definitions TS)
    list(APPEND definitions $<TARGET_PROPERTY:${NAME},INTERFACE_COMPILE_DEFINITIONS>)

    list(APPEND includeDirs $<TARGET_PROPERTY:${NAME},INTERFACE_INCLUDE_DIRECTORIES>)
    list(APPEND includeDirs $<$<TARGET_EXISTS:${tsStd}>:$<TARGET_PROPERTY:${tsStd},INTERFACE_INCLUDE_DIRECTORIES>>)
    list(APPEND includeDirs ${CMAKE_CXX_IMPLICIT_INCLUDE_DIRECTORIES})

    if (NOT $ENV{SYSROOT_DIR} STREQUAL "")
        set(sysroot "--sysroot=$ENV{SYSROOT_DIR}")
        message(STATUS "SYSROOT=${sysroot}")
    endif()

    set(ignoreError $<BOOL:${ARG_IGNORE_ERROR}>)
    set(redirect    $<${ignoreError}:2$<ANGLE-R>>)
    set(errorFile   $<${ignoreError}:${outputFile}>)
    set(errorCode   $<${ignoreError}:|| exit 0>)

    # We cannot use TARGET parameter bc it is not valid for object libraries.
    add_custom_command(
        OUTPUT ${outputFile}
        DEPENDS ${inputFile}
        COMMENT "[TSD] ${TS_DECLARATOR}: ${outputFile}"
        COMMAND ${CMAKE_COMMAND} -E make_directory "${outputDir}"
        COMMAND ${CMAKE_COMMAND} -E env "${envVariables}"
        ${TS_DECLARATOR}
            -nobuiltininc -x c++
            --target=${abi}
            "-D$<JOIN:${definitions},;-D>"
            "-I$<JOIN:$<REMOVE_DUPLICATES:${includeDirs}>,;-I>"
            ${sysroot}
            ${inputFile}
            "${redirect}" "${errorFile}" "${errorCode}" # Quote to avoid wrong quoting)
        COMMAND_EXPAND_LISTS
        VERBATIM
    )
endfunction()

function(add_ts_declarations_target NAME ...)
    cmake_parse_arguments(PARSE_ARGV 1 "ARG"
        ""
        "TARGET_COMPILER_ABI;IMPORT;NO_IMPORT_STD;TEMP_DIR;OUTPUT_DIR;IGNORE_ERROR;NO_HEAD"
        "SOURCES;OUT_DECLARATIONS"
    )

    set(outputFileList )
    foreach(inputFile ${ARG_SOURCES})
        get_filename_component(outputFile ${inputFile} NAME_WLE)
        if (ARG_IGNORE_ERROR)
            set(ext err)
        else()
            set(ext d.ts)
        endif()
        set(outputFile "${ARG_OUTPUT_DIR}/${outputFile}.${ext}")

        run_declarator2(${NAME}
            SOURCE "${inputFile}"
            DEST "${outputFile}"
            TARGET_COMPILER_ABI "${ARG_TARGET_COMPILER_ABI}"
            IMPORT "${ARG_IMPORT}"
            NO_IMPORT_STD "${ARG_NO_IMPORT_STD}"
            TEMP_DIR "${ARG_TEMP_DIR}"
            IGNORE_ERROR "${ARG_IGNORE_ERROR}"
            NO_HEAD "${ARG_NO_HEAD}"
        )

        list(APPEND outputFileList "${outputFile}")
    endforeach()

    add_custom_target(${NAME}_ts_declarations DEPENDS ${outputFileList})
    add_dependencies(${NAME} ${NAME}_ts_declarations)

    set(${ARG_OUT_DECLARATIONS} ${outputFileList} PARENT_SCOPE)
endfunction()

### Generate TS declarations for given c++ sources
### Args:
# NAME - target name
# TARGET_COMPILER_ABI - target compiler abi (e.g. "x86_64-linux-gnu")
# TS_HEADERS - list of C++ headers that should be converted to declarations
# TS_IMPORT - import instructions(s) that should be inserted in generated declarations
# OUTPUT_DIR - absolute path to output directory
# IGNORE_ERROR - cmake script ignores declarator errors [true/false]
# NO_HEAD - declarator doesn't print head in the top of file-declaration
# [OUT] OUT_DECLARATIONS - generated files-declarations
function(ts_generate_declarations NAME ...)
    cmake_parse_arguments(PARSE_ARGV 1 "ARG"
        ""
        "TS_IMPORT;TARGET_COMPILER_ABI;OUTPUT_DIR;IGNORE_ERROR;NO_HEAD"
        "TS_HEADERS;OUT_DECLARATIONS"
    )

    if (ARG_UNPARSED_ARGUMENTS)
        message (FATAL_ERROR "Unknown arguments: ${ARG_UNPARSED_ARGUMENTS}")
    endif ()

    if (NOT ARG_TARGET_COMPILER_ABI OR ARG_TARGET_COMPILER_ABI STREQUAL "")
        message (FATAL_ERROR "TARGET_COMPILER_ABI is not specified")
    endif ()

    if (NOT ARG_OUTPUT_DIR OR ARG_OUTPUT_DIR STREQUAL "")
        message (FATAL_ERROR "OUTPUT_DIR is not specified")
    endif ()

    if (NOT ARG_OUT_DECLARATIONS)
        message (FATAL_ERROR "OUT_DECLARATIONS is not specified")
    endif ()

    # leave it as a property since this is an internal flag and it shouldn't be exposed to public API
    get_target_property(NO_IMPORT_STD ${NAME} TS_NO_IMPORT_STD)

    set(DECLARATIONS )
    add_ts_declarations_target(${NAME}
        SOURCES ${ARG_TS_HEADERS} # dosn't need quotes since value is a list and semicolons are used as a separators
        IMPORT "${ARG_TS_IMPORT}" # needs quotes since value may containt semicolon
        TARGET_COMPILER_ABI ${ARG_TARGET_COMPILER_ABI}
        NO_IMPORT_STD "${NO_IMPORT_STD}"
        OUTPUT_DIR "${ARG_OUTPUT_DIR}"
        TEMP_DIR "${ARG_OUTPUT_DIR}/temp"
        IGNORE_ERROR "${ARG_IGNORE_ERROR}"
        NO_HEAD "${ARG_NO_HEAD}"
        OUT_DECLARATIONS DECLARATIONS
    )

    set(${ARG_OUT_DECLARATIONS} ${DECLARATIONS} PARENT_SCOPE)
endfunction()


### Generate TS module index
### Args:
# NAME - target name
# EXPORTED_NAME - exported name from export signature
# MODULE_NAME - module name from export signature
#   (e.g. export { ${ARG_EXPORTED_NAME} } from '${ARG_MODULE_NAME}')
# DECLARATIONS - list of declaration files
# NO_HEAD - disable head printing in index-file
# OUT_DIRECTORY - directory with generated index.ts file
function(ts_generate_index NAME ...)
    cmake_parse_arguments(PARSE_ARGV 1 "ARG"
        ""
        "EXPORTED_NAME;MODULE_NAME;NO_HEAD;OUT_DIRECTORY;"
        "DECLARATIONS;"
    )

    if (ARG_UNPARSED_ARGUMENTS)
        message (FATAL_ERROR "Unknown arguments: ${ARG_UNPARSED_ARGUMENTS}")
    endif ()

    if (NOT ARG_EXPORTED_NAME OR ARG_EXPORTED_NAME STREQUAL "")
        message (FATAL_ERROR "EXPORTED_NAME is not specified")
    endif ()

    if (NOT ARG_MODULE_NAME OR ARG_MODULE_NAME STREQUAL "")
        message (FATAL_ERROR "MODULE_NAME is not specified")
    endif ()

    if (NOT ARG_OUT_DIRECTORY)
        message (FATAL_ERROR "OUT_DIRECTORY is not specified")
    endif ()

    if (NOT ARG_DECLARATIONS)
        message (FATAL_ERROR "DECLARATIONS is not specified")
    endif ()

    set(output_file "${ARG_OUT_DIRECTORY}/index.ts")

    # generate filenames of declarations without full paths
    set(declarations )
    foreach(declaration_item ${ARG_DECLARATIONS})
        get_filename_component(declaration "${declaration_item}" NAME)
        list(APPEND declarations "${declaration}")
    endforeach()

    if (ARG_NO_HEAD AND NOT ARG_NO_HEAD STREQUAL "" AND NOT ARG_NO_HEAD STREQUAL "false")
        set(no_head "true")
    else()
        set(no_head "false")
    endif()

    set(command "${TS_INDEXER} \
        --outputFolder ${ARG_OUT_DIRECTORY} \
        --exported \"${ARG_EXPORTED_NAME}\" \
        --module ${ARG_MODULE_NAME} \
        --files \"${declarations}\" \
        --no_head ${no_head}"
    )

    add_custom_command(
        OUTPUT ${output_file}
        COMMAND echo "Generate index.ts..."
        VERBATIM COMMAND sh -c "mkdir -p ${ARG_OUT_DIRECTORY}"
        VERBATIM COMMAND sh -c "${command}"
    )

    string(MD5 TARGET "${output_file}")

    add_custom_target(${TARGET}
        DEPENDS ${output_file}
    )

    add_dependencies(${NAME} ${TARGET})
endfunction()

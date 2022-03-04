#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
# 
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
# 
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

#   target dep_target source includes target_compiler_abi import stage_dir output

function(run_declarator ...)
    cmake_parse_arguments(PARSE_ARGV 0 "ARG"
        ""
        "TARGET;DEPENDS_ON;SOURCE;TARGET_COMPILER_ABI;IMPORT;TEMP_DIR;OUTPUT_DIR;OUT_DECLARATION"
        "INCLUDES;"
    )

    if (ARG_UNPARSED_ARGUMENTS)
        message (FATAL_ERROR "Unknown arguments: ${ARG_UNPARSED_ARGUMENTS}")
    endif ()

    if (NOT ARG_TARGET OR ARG_TARGET STREQUAL "")
        message (FATAL_ERROR "TARGET is not specified")
    endif ()

    if (NOT ARG_DEPENDS_ON OR ARG_DEPENDS_ON STREQUAL "")
        message (FATAL_ERROR "DEPENDS_ON is not specified")
    endif ()

    if (NOT ARG_SOURCE)
        message (FATAL_ERROR "SOURCE is not specified")
    endif ()

    if (NOT ARG_TARGET_COMPILER_ABI OR ARG_TARGET_COMPILER_ABI STREQUAL "")
        message (FATAL_ERROR "TARGET_COMPILER_ABI is not specified")
    endif ()

    if (NOT ARG_OUTPUT_DIR OR ARG_OUTPUT_DIR STREQUAL "")
        message (FATAL_ERROR "OUTPUT_DIR is not specified")
    endif ()

    if (NOT ARG_OUT_DECLARATION)
        message (FATAL_ERROR "OUT_DECLARATION is not specified")
    endif ()

    if (NOT ARG_INCLUDES)
        message (FATAL_ERROR "INCLUDES is not specified")
    endif ()

    get_filename_component(source_fn "${ARG_SOURCE}" NAME)
    string(REPLACE ".h" ".d.ts" OUTPUT_FN "${source_fn}")

    set(INCLUDES ${ARG_INCLUDES})
    string(REPLACE ";" " " INCLUDES "${INCLUDES}")

    set(OUTPUT_DIR "${ARG_OUTPUT_DIR}/declarations")
    set(OUTPUT_FILE "${OUTPUT_DIR}/${OUTPUT_FN}")

    if(NOT "$ENV{SYSROOT_DIR}" STREQUAL "")
        set(SYSROOT "--sysroot=$ENV{SYSROOT_DIR}")
        message(STATUS "SYSROOT=$ENV{SYSROOT_DIR}")
    endif()

    set(variables "DECLARATOR_OUTPUT_DIR=\"${OUTPUT_DIR}\" DECLARATOR_IMPORT=\"${ARG_IMPORT}\" DECLARATOR_TEMP_DIR=\"${ARG_TEMP_DIR}\"")
    set(command "${variables} ${TS_DECLARATOR} -x c++ --target=${ARG_TARGET_COMPILER_ABI} ${SYSROOT} -D TS ${ARG_SOURCE} ${INCLUDES}")

    add_custom_command(
        OUTPUT ${OUTPUT_FILE}
        DEPENDS ${source}
        COMMAND echo "Run declarator..."
        COMMAND mkdir -p "${OUTPUT_DIR}"
        VERBATIM COMMAND sh -c "${command}"
    )

    add_custom_target(${ARG_TARGET}
        DEPENDS ${OUTPUT_FILE}
    )

    add_dependencies(${ARG_TARGET} ${ARG_DEPENDS_ON})
    set(${output} ${OUTPUT_FILE} PARENT_SCOPE)
endfunction()

function(generate_declarations ...)
    cmake_parse_arguments(PARSE_ARGV 0 "ARG"
        ""
        "TARGET;DEPENDS_ON;TARGET_COMPILER_ABI;IMPORT;TEMP_DIR;OUTPUT_DIR"
        "INCLUDE_DIRECTORIES;HEADERS;DECLARATIONS"
    )

    if (ARG_UNPARSED_ARGUMENTS)
        message (FATAL_ERROR "Unknown arguments: ${ARG_UNPARSED_ARGUMENTS}")
    endif ()

    if (NOT ARG_TARGET OR ARG_TARGET STREQUAL "")
        message (FATAL_ERROR "TARGET is not specified")
    endif ()

    if (NOT ARG_DEPENDS_ON OR ARG_DEPENDS_ON STREQUAL "")
        message (FATAL_ERROR "DEPENDS_ON is not specified")
    endif ()

    if (NOT ARG_TARGET_COMPILER_ABI OR ARG_TARGET_COMPILER_ABI STREQUAL "")
        message (FATAL_ERROR "TARGET_COMPILER_ABI is not specified")
    endif ()

    if (NOT ARG_OUTPUT_DIR OR ARG_OUTPUT_DIR STREQUAL "")
        message (FATAL_ERROR "OUTPUT_DIR is not specified")
    endif ()

    if (NOT ARG_DECLARATIONS)
        message (FATAL_ERROR "DECLARATIONS is not specified")
    endif ()

    set(include_directories ${ARG_INCLUDE_DIRECTORIES})
    list(TRANSFORM include_directories PREPEND "-I")

    set (output_list )
    foreach(header ${ARG_HEADERS})
        get_filename_component(header_fn "${header}" NAME)
        set(declaration_target "decl_${export_name}_${header_fn}_target")

        set (output )
        run_declarator(
            TARGET ${declaration_target}
            DEPENDS_ON ${ARG_TARGET}
            SOURCE "${header}"
            INCLUDES "${include_directories}"
            TARGET_COMPILER_ABI "${ARG_TARGET_COMPILER_ABI}"
            IMPORT "${ARG_IMPORT}"
            TEMP_DIR "${ARG_TEMP_DIR}"
            OUTPUT_DIR "${ARG_OUTPUT_DIR}"
            OUT_DECLARATION output
        )

        add_dependencies(${ARG_DEPENDS_ON} ${declaration_target})
        list(APPEND output_list "${output}")
    endforeach()

    set(${ARG_DECLARATIONS} ${output_list} PARENT_SCOPE)
endfunction()

function(generate_index dep_target exported_name declaration_list output_dir)
    set(target "${dep_target}_index_target")
    set(output_file "${output_dir}/index.ts")
    set(declarations )

    foreach(declaration_item ${declaration_list})
        get_filename_component(declaration "${declaration_item}" NAME)
        list(APPEND declarations "${declaration}")
    endforeach()

    # prepare content of file
    set(content_list )
    foreach(declaration ${declarations})
        set(s "/// <reference path='${declaration}' />")
        list(APPEND content_list "${s}")
    endforeach()

    list(APPEND content_list "export { ${exported_name} } from 'mgt';")

    # out to file semicolon separated list and then replace all semicolons to "\n"
    # and replace "'" to """
    add_custom_command(
        OUTPUT ${output_file}
        COMMAND echo "Generate index.ts ..."
        COMMAND mkdir -p "${output_dir}"
        VERBATIM COMMAND sh -c "echo \"${content_list}\" > \"${output_file}\""
        VERBATIM COMMAND sh -c "sed -i 's/;/\\n/g' ${output_file}"
        VERBATIM COMMAND sh -c "sed -i \"s/\'/\\\"/g\" ${output_file}"
    )

    add_custom_target(${target}
        DEPENDS ${output_file}
    )

    add_dependencies(${dep_target} ${target})
endfunction()

#[[
function(format_import module_path items out_list)
    set(result )

    foreach(item ${items})
        set(template "%1:%2")
        string(REPLACE "%1" "${item}" R1 ${template})
        string(REPLACE "%2" "${module_path}" R2 ${R1})
        list(APPEND result ${R2})
    endforeach()

    list(APPEND ${out_list} ${result})
    set(${out_list} ${${out_list}} PARENT_SCOPE)
endfunction()
]]


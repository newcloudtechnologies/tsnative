#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
# 
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
# 
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

function(populate_includes target dir_list)
    set(result "")

    get_target_property(targets ${target} LINK_LIBRARIES)
    list(FILTER targets EXCLUDE REGEX "^[$][<][$][<].*[>].*[>]")

    list(PREPEND targets ${target})
    message(STATUS "[${target}] targets=${targets}")

    foreach(item ${targets})
        get_target_property(includes ${item} INTERFACE_INCLUDE_DIRECTORIES)
        list(FILTER includes EXCLUDE REGEX "^[$][<].*[>]$")
        list(FILTER includes EXCLUDE REGEX ".*[-]NOTFOUND")

        set(real_path_includes )
        foreach(item ${includes})
            get_filename_component(real_path_item "${item}" REALPATH)
            list(APPEND real_path_includes ${real_path_item})
        endforeach()

        list(APPEND result ${real_path_includes})
    endforeach()

    set(${dir_list} ${result} PARENT_SCOPE)
endfunction()

function(run_declarator target dep_target source includes target_compiler_abi import stage_dir output)
    get_filename_component(source_fn "${source}" NAME)
    string(REPLACE ".h" ".d.ts" OUTPUT_FN "${source_fn}")

    string(REPLACE ";" " " includes "${includes}")

    set(output_dir "${stage_dir}/declarations")
    set(output_file "${output_dir}/${OUTPUT_FN}")

    message(STATUS "source=${source}")

    if(NOT "$ENV{SYSROOT_DIR}" STREQUAL "")
        set(SYSROOT "--sysroot=$ENV{SYSROOT_DIR}")
        message(STATUS "SYSROOT=$ENV{SYSROOT_DIR}")
    endif()

    set(command "DECLARATOR_OUTPUT_DIR=${output_dir} DECLARATOR_IMPORT=\"${import}\" ${TS_DECLARATOR} -x c++ --target=${target_compiler_abi} ${SYSROOT} -D TS ${source} ${includes}")

    add_custom_command(
        OUTPUT ${output_file}
        DEPENDS ${source}
        COMMAND echo "Run declarator..."
        COMMAND mkdir -p "${output_dir}"
        VERBATIM COMMAND sh -c "${command}"
    )

# COMMAND sh -c "DECLARATOR_OUTPUT_DIR=${output_dir} DECLARATOR_IMPORT=${import} ${TS_DECLARATOR} -x c++ --target=${target_compiler_abi} ${SYSROOT} -D TS ${source} ${includes}"

    add_custom_target(${target}
        DEPENDS ${output_file}
    )

    add_dependencies(${target} ${dep_target})
    set(${output} ${output_file} PARENT_SCOPE)
endfunction()

function(generate_declarations ...)
    cmake_parse_arguments(PARSE_ARGV 0 "ARG"
        ""
        "TARGET;DEPENDS_ON;TARGET_COMPILER_ABI;IMPORT;OUTPUT_DIR"
        "INCLUDE_DIRECTORIES;HEADERS;DECLARATIONS"
    )

#    message(STATUS "OUTPUT_DIR=${OUTPUT_DIR}")

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
            ${declaration_target}
            ${ARG_TARGET}
            "${header}"
            "${include_directories}"
            "${ARG_TARGET_COMPILER_ABI}"
            "${ARG_IMPORT}"
            "${ARG_OUTPUT_DIR}"
            output
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


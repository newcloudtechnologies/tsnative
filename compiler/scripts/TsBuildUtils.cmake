#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

if (NOT __ts_build_utils_cmake_guard)
set (__ts_build_utils_cmake_guard 1)

# TODO: fill the info
# Required non-empty variables:
# * PROJECT_ROOT
# * PROJECT_BUILD_DIR
# * PROJECT_OUTPUT_BINARY
# * PROJECT_ENTRY_NAME

message(STATUS "Found TsBuildUtils in ${CMAKE_CURRENT_LIST_DIR}")

# CMake return wrong value for this inside the function and do not
# point to this file.
set(CACHED_CMAKE_CURRENT_LIST_DIR ${CMAKE_CURRENT_LIST_DIR})

if (TS_PROFILE_BUILD)
    find_package(Python)
    set(BUILD_TIME_PROFILER_SCRIPT ${CMAKE_CURRENT_LIST_DIR}/build_time_profiler.py)
endif()

function(makeOutputDir target dep_target executablePath entry output_dir)
    getBinaryName(${entry} binary_name "${executablePath}")

    if("${PROJECT_BUILD_DIR}" STREQUAL "")
        set(dir "${CMAKE_CURRENT_BINARY_DIR}/${binary_name}.dir")
    else()
        set(dir "${PROJECT_BUILD_DIR}/${binary_name}.dir")
    endif()

    add_custom_command(
        OUTPUT ${dir}
        DEPENDS ${entry}
        COMMAND echo "Creating output dir..."
        COMMAND mkdir -p "${dir}"
    )

    add_custom_target(${target}
        DEPENDS ${dir}
    )

    add_dependencies(${target} ${dep_target})

    set(${output_dir} ${dir} PARENT_SCOPE)
endfunction()

function(getBinaryName entry binaryName executablePath)
    get_filename_component(entry_fn "${executablePath}" NAME)

    set(${binaryName} ${entry_fn} PARENT_SCOPE)
endfunction()

function(getBinaryPath binaryPath executablePath)
    get_filename_component(source_path "${executablePath}" DIRECTORY)

    set(${binaryPath} ${source_path} PARENT_SCOPE)
endfunction()

function(getProjectFiles projectRoot entry projectFiles)
    file(GLOB_RECURSE project_files ${projectRoot}/*.ts)

    # filter node_modules
    list(FILTER project_files EXCLUDE REGEX ".*/node_modules/.*")

    # filter entry
    list(FILTER project_files EXCLUDE REGEX ".*/${entry_fn}")

    set(${projectFiles} ${project_files} PARENT_SCOPE)
endfunction()

function(extractSymbols target dep_target dependencies output_dir demangledList mangledList)
    set(output_demangledList )
    set(output_mangledList )

    foreach(dep_full_fn ${dependencies})
        get_filename_component(dep_fn "${dep_full_fn}" NAME)

        set(demangled_nm_fn "${output_dir}/${dep_fn}.dm.nm")
        set(mangled_nm_fn "${output_dir}/${dep_fn}.m.nm")

        list(APPEND output_demangledList ${demangled_nm_fn})
        list(APPEND output_mangledList ${mangled_nm_fn})

        add_custom_command(
            OUTPUT ${demangled_nm_fn}
            COMMAND ${CMAKE_NM} -C ${dep_full_fn} > ${demangled_nm_fn}
            DEPENDS ${dep_full_fn}
        )

        add_custom_command(
            OUTPUT ${mangled_nm_fn}
            COMMAND ${CMAKE_NM} ${dep_full_fn} > ${mangled_nm_fn}
            DEPENDS ${dep_full_fn}
        )
    endforeach()

    add_custom_target(${target}
        DEPENDS ${output_demangledList} ${output_mangledList}
    )

    add_dependencies(${target} ${dep_target})

    set(${demangledList} ${output_demangledList} PARENT_SCOPE)
    set(${mangledList} ${output_mangledList} PARENT_SCOPE)
endfunction()

function(generateSeed target dep_target output_dir seed_src)
    set(SEED_CPP_OUT "${output_dir}/seed.cpp")
    set(TSMAIN_H_OUT "${output_dir}/tsmain.h")

    add_custom_command(
        OUTPUT ${SEED_CPP_OUT} ${TSMAIN_H_OUT}
        COMMAND cp "${CACHED_CMAKE_CURRENT_LIST_DIR}/seed/*" "${output_dir}"
    )

    add_custom_target(${target}
        DEPENDS ${SEED_CPP_OUT}
    )

    add_dependencies(${target} ${dep_target})

    set(${seed_src} ${SEED_CPP_OUT} PARENT_SCOPE)
endfunction()

function(generateSeedForTests target dep_target output_dir seed_src)
    message("GENERATE SEED FOR TESTS")
    set(SEED_CPP_OUT "${output_dir}/seed_for_tests.cpp")
    set(TSMAIN_H_OUT "${output_dir}/tsmain.h")

    add_custom_command(
            OUTPUT ${SEED_CPP_OUT} ${TSMAIN_H_OUT}
            COMMAND cp "${CACHED_CMAKE_CURRENT_LIST_DIR}/seed/*" "${output_dir}"
    )

    add_custom_target(${target}
            DEPENDS ${SEED_CPP_OUT}
            )

    add_dependencies(${target} ${dep_target})

    set(${seed_src} ${SEED_CPP_OUT} PARENT_SCOPE)
endfunction()

function(instantiate_classes target dep_target projectRoot entry tsConfig baseUrl sources includes output_dir trace_opt classes_src demangledList mangledList)
    set(output
        "${output_dir}/instantiated_classes.cpp")

    string(REPLACE ";" ", " DEMANGLED "${demangledList}")
    string(REPLACE ";" ", " MANGLED "${mangledList}")
    string(REPLACE ";" ", " INCLUDES "${includes}")

    set(INCLUDE_DIRS )
    if (INCLUDES)
        set(INCLUDE_DIRS --includeDirs ${INCLUDES})
    endif()

    set(START_PROFILE_COMMAND ":")
    set(END_PROFILE_COMMAND ":")

    if (TS_PROFILE_BUILD)
        set(START_PROFILE_COMMAND "${Python_EXECUTABLE} ${BUILD_TIME_PROFILER_SCRIPT} --tag TEMPLATE_CLASSES_INSTANTIATION --start")
        set(END_PROFILE_COMMAND "${Python_EXECUTABLE} ${BUILD_TIME_PROFILER_SCRIPT} --tag TEMPLATE_CLASSES_INSTANTIATION --end")
    endif()

    add_custom_command(
        OUTPUT ${output}
        DEPENDS ${entry} ${sources}
        WORKING_DIRECTORY ${projectRoot}
        COMMAND echo "Instantiating classes..."
        COMMAND bash -c ${START_PROFILE_COMMAND}
        COMMAND ${CMAKE_COMMAND} -E env "${TS_COMPILER_ENV}"
        ARGS ${TS_COMPILER} ${entry}
                        --tsconfig ${tsConfig}
                        --baseUrl ${baseUrl}
                        --processTemplateClasses
                        # TODO: use generator expressions: --includeDirs "\'$<TARGET_PROPERTY:tsnative-std,INTERFACE_INCLUDE_DIRECTORIES>\'"
                        ${INCLUDE_DIRS}
                        --templatesOutputDir ${output_dir}
                        --build ${output_dir}
                        --demangledTables ${DEMANGLED}
                        --mangledTables ${MANGLED}
                        ${trace_opt}
        COMMAND bash -c ${END_PROFILE_COMMAND}
    )

    add_custom_target(${target}
        DEPENDS ${output})

    add_dependencies(${target} ${dep_target})

    set(${classes_src} ${output} PARENT_SCOPE)
endfunction()

function(instantiate_functions target dep_target projectRoot entry tsConfig baseUrl sources includes output_dir demangledList mangledList trace_opt functions_src)
    set(output
        "${output_dir}/instantiated_functions.cpp")

    string(REPLACE ";" ", " DEMANGLED "${demangledList}")
    string(REPLACE ";" ", " MANGLED "${mangledList}")
    string(REPLACE ";" ", " INCLUDES "${includes}")

    set(INCLUDE_DIRS )
    if (INCLUDES)
        set(INCLUDE_DIRS --includeDirs ${INCLUDES})
    endif()

    set(START_PROFILE_COMMAND ":")
    set(END_PROFILE_COMMAND ":")

    if (TS_PROFILE_BUILD)
        set(START_PROFILE_COMMAND "${Python_EXECUTABLE} ${BUILD_TIME_PROFILER_SCRIPT} --tag TEMPLATE_FUNCTIONS_INSTANTIATION --start")
        set(END_PROFILE_COMMAND "${Python_EXECUTABLE} ${BUILD_TIME_PROFILER_SCRIPT} --tag TEMPLATE_FUNCTIONS_INSTANTIATION --end")
    endif()

    add_custom_command(
        OUTPUT ${output}
        DEPENDS ${entry} ${sources}
        WORKING_DIRECTORY ${projectRoot}
        COMMAND echo "Instantiating functions..."
        COMMAND bash -c ${START_PROFILE_COMMAND}
        COMMAND ${CMAKE_COMMAND} -E env "${TS_COMPILER_ENV}"
        ARGS ${TS_COMPILER} ${entry}
                        --tsconfig ${tsConfig}
                        --baseUrl ${baseUrl}
                        --processTemplateFunctions 
                        # TODO: use generator expressions: --includeDirs $<TARGET_PROPERTY:tsnative-std,INTERFACE_INCLUDE_DIRECTORIES>
                        ${INCLUDE_DIRS}
                        --demangledTables ${DEMANGLED}
                        --mangledTables ${MANGLED}
                        --templatesOutputDir ${output_dir}
                        --build ${output_dir}
                        ${trace_opt}
        COMMAND bash -c ${END_PROFILE_COMMAND}
    )

    add_custom_target(${target}
        DEPENDS ${output})

    add_dependencies(${target} ${dep_target})

    set(${functions_src} ${output} PARENT_SCOPE)
endfunction()

function(compile_cpp target dep_target includes definitions entry output_dir compiled)
    get_filename_component(bin_name "${entry}" NAME)

    # TODO: refactor this whole sequence
    # 1 use object library
    add_library(${target} STATIC ${entry})

    if (TS_PROFILE_BUILD)
        set(START_PROFILE_COMMAND "${Python_EXECUTABLE} ${BUILD_TIME_PROFILER_SCRIPT} --tag COMPILE_CXX_${bin_name} --start")
        set(END_PROFILE_COMMAND "${Python_EXECUTABLE} ${BUILD_TIME_PROFILER_SCRIPT} --tag COMPILE_CXX_${bin_name} --end")

        add_custom_command(
            TARGET ${target}
            PRE_BUILD
            COMMAND bash -c ${START_PROFILE_COMMAND}
        )

        add_custom_command(
            TARGET ${target}
            POST_BUILD
            COMMAND bash -c ${END_PROFILE_COMMAND}
        )

    endif()

    set_target_properties(${target} PROPERTIES
        ARCHIVE_OUTPUT_DIRECTORY ${output_dir}
        ARCHIVE_OUTPUT_NAME ${bin_name})

    target_include_directories(${target} PUBLIC ${tsnative-declarator_INCLUDE_DIRS})
    target_link_libraries(${target} PUBLIC tsnative-std::tsnative-std tsnative-declarator)

    if (NOT "${TS_EXTENSION_TARGET}" STREQUAL "fake")
        target_link_libraries(${target} PRIVATE ${TS_EXTENSION_TARGET})
    endif()

    # 2 use $<TARGET_FILE:${target}> to obtain output file name later for nm
    set (output ${output_dir}/${CMAKE_STATIC_LIBRARY_PREFIX}${bin_name}${CMAKE_STATIC_LIBRARY_SUFFIX})

    add_dependencies(${target} ${dep_target})
    # 3 simplify structure!
    set(${compiled} ${output} PARENT_SCOPE)
endfunction()


function(verify_ts target dep_target projectRoot entry baseUrl sources output_dir)
    get_filename_component(entry_fn "${entry}" NAME)

    string(REPLACE ".ts" ".js" OUTPUT_FN "${entry_fn}")
    set(output "${output_dir}/${OUTPUT_FN}")

    # TODO: make verifies args configurable for clients
    # at least --traceResolution
    add_custom_command(
        OUTPUT ${output}
        DEPENDS "${entry}" "${sources}"
        WORKING_DIRECTORY ${projectRoot}
        COMMAND echo "Running TS verifier: ${entry}"
        COMMAND ${TS_VERIFIER}
        ARGS ${entry} --alwaysStrict 
                      --target es6 
                      --experimentalDecorators
                      --moduleResolution node
                      --baseUrl ${baseUrl}
                      --outDir ${output_dir}
                    #   --traceResolution
    )

    add_custom_target(${target}
        DEPENDS ${output}
    )

    add_dependencies(${target} ${dep_target})
endfunction()

function(compile_ts target dep_target projectRoot entry tsConfig baseUrl sources demangledList mangledList output_dir is_printIr trace_opt ll_bytecode is_debug need_run_event_loop)
    get_filename_component(entry_fn "${entry}" NAME)

    string(REPLACE ".ts" ".ll" OUTPUT_FN "${entry_fn}")
    string(REPLACE ";" ", " DEMANGLED "${demangledList}")
    string(REPLACE ";" ", " MANGLED "${mangledList}")

    set(output "${output_dir}/${OUTPUT_FN}")

    set(MAYBE_PRINT_IR )
    if (${is_printIr})
        set(MAYBE_PRINT_IR --printIR)
    endif()

    set(TS_DEBUG )
    if (${is_debug})
        set(TS_DEBUG --debug)
    endif()

    set(TS_RUN_EVENT_LOOP )
    if (${need_run_event_loop})
        set(TS_RUN_EVENT_LOOP --run_event_loop)
        if (${IS_TEST})
            unset(TS_RUN_EVENT_LOOP)
        endif()
    endif()

    set(START_PROFILE_COMMAND ":")
    set(END_PROFILE_COMMAND ":")

    if (TS_PROFILE_BUILD)
        set(START_PROFILE_COMMAND "${Python_EXECUTABLE} ${BUILD_TIME_PROFILER_SCRIPT} --tag COMPILE_TS --start")
        set(END_PROFILE_COMMAND "${Python_EXECUTABLE} ${BUILD_TIME_PROFILER_SCRIPT} --tag COMPILE_TS --end")
    endif()

    add_custom_command(
        OUTPUT ${output}
        DEPENDS "${entry}" "${sources}" "${demangledList}" "${mangledList}"
        WORKING_DIRECTORY ${projectRoot}
        COMMAND echo "Running TS compiler: ${entry}"
        COMMAND bash -c ${START_PROFILE_COMMAND}
        COMMAND ${CMAKE_COMMAND} -E env "${TS_COMPILER_ENV}"
        ARGS ${TS_COMPILER} ${entry}
                      --tsconfig ${tsConfig}
                      --baseUrl ${baseUrl}
                      --demangledTables ${DEMANGLED}
                      --mangledTables ${MANGLED}
                      --build ${output_dir}
                      --emitIR
                      ${MAYBE_PRINT_IR}
                      ${trace_opt}
                      ${TS_DEBUG}
                      ${TS_RUN_EVENT_LOOP}
                      COMMAND bash -c ${END_PROFILE_COMMAND}
    )

    add_custom_target(${target}
        DEPENDS ${output}
    )

    add_dependencies(${target} ${dep_target})

    set(${ll_bytecode} ${output} PARENT_SCOPE)
endfunction()

function(compile_ll target dep_target ll_bytecode optimizationLevel output_dir compiled_source)
    find_package(LLVM REQUIRED CONFIG)
    string(REPLACE ".ll" ".o" output "${ll_bytecode}")

    set(START_PROFILE_COMMAND ":")
    set(END_PROFILE_COMMAND ":")

    if (TS_PROFILE_BUILD)
        set(START_PROFILE_COMMAND "${Python_EXECUTABLE} ${BUILD_TIME_PROFILER_SCRIPT} --tag COMPILE_IR --start")
        set(END_PROFILE_COMMAND "${Python_EXECUTABLE} ${BUILD_TIME_PROFILER_SCRIPT} --tag COMPILE_IR --end")
    endif()

    # TODO: make compile options configurable
    add_custom_command(
        OUTPUT ${output}
        DEPENDS ${ll_bytecode}
        COMMAND echo "Running llc..."
        COMMAND bash -c ${START_PROFILE_COMMAND}
        COMMAND ${LLVM_TOOLS_BINARY_DIR}/llc${CMAKE_EXECUTABLE_SUFFIX} ${optimizationLevel} -relocation-model=pic -filetype=obj ${ll_bytecode} -o ${output}
        COMMAND bash -c ${END_PROFILE_COMMAND}
    )

    add_custom_target(${target}
        DEPENDS ${output}
    )

    add_dependencies(${target} ${dep_target})

    set(${compiled_source} ${output} PARENT_SCOPE)
endfunction()

function(link target dep_target executablePath seed_src compiled_source dependencies)
    getBinaryPath(binaryPath "${executablePath}")
    set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${binaryPath}")

    add_executable(${${target}} WIN32 ${seed_src})

    if (TS_PROFILE_BUILD)
        set(START_PROFILE_COMMAND "${Python_EXECUTABLE} ${BUILD_TIME_PROFILER_SCRIPT} --tag LINK --start")
        set(END_PROFILE_COMMAND "${Python_EXECUTABLE} ${BUILD_TIME_PROFILER_SCRIPT} --tag LINK --end")

        add_custom_command(
            TARGET ${${target}}
            PRE_BUILD
            COMMAND bash -c ${START_PROFILE_COMMAND}
        )

        add_custom_command(
            TARGET ${${target}}
            POST_BUILD
            COMMAND bash -c ${END_PROFILE_COMMAND}
        )
    endif()

    target_include_directories(${${target}} PUBLIC ${tsnative-declarator_INCLUDE_DIRS})

    target_link_libraries(${${target}}
        PRIVATE
            ${compiled_source}
            ${dependencies}
            tsnative-std::tsnative-std
    )

    if (NOT "${TS_EXTENSION_TARGET}" STREQUAL "fake")
        target_link_libraries(${${target}} PRIVATE ${TS_EXTENSION_TARGET})
    endif()


    add_dependencies(${${target}} ${dep_target})
endfunction()

function(add_antiq_executable target ...)
    cmake_parse_arguments(PARSE_ARGV 1 "ARG"
        ""
        "DEP_TARGET;PROJECT_ROOT;ENTRY;TS_CONFIG;BASE_URL;OPTIMIZATION_LEVEL;IS_TEST;IS_PRINT_IR;TRACE_IMPORT;IS_DEBUG;NEED_RUN_EVENT_LOOP;EXECUTABLE_PATH"
        "INCLUDES;DEPENDENCIES;DEFINITIONS"
    )
    message(STATUS "add_antiq_executable:")
    message(STATUS "target ${target}")
    message(STATUS "ARG_DEP_TARGET ${ARG_DEP_TARGET}")
    message(STATUS "ARG_PROJECT_ROOT ${ARG_PROJECT_ROOT}")
    message(STATUS "ARG_ENTRY ${ARG_ENTRY}")
    message(STATUS "ARG_TS_CONFIG ${ARG_TS_CONFIG}")
    message(STATUS "ARG_BASE_URL ${ARG_BASE_URL}")
    message(STATUS "ARG_INCLUDES ${ARG_INCLUDES}")
    message(STATUS "ARG_DEPENDENCIES ${ARG_DEPENDENCIES}") # TODO: remove
    message(STATUS "ARG_DEFINITIONS ${ARG_DEFINITIONS}")
    message(STATUS "ARG_OPTIMIZATION_LEVEL ${OPTIMIZATION_LEVEL}")
    message(STATUS "ARG_IS_TEST ${ARG_IS_TEST}")
    message(STATUS "ARG_IS_PRINT_IR ${ARG_IS_PRINT_IR}")
    message(STATUS "ARG_TRACE_IMPORT ${ARG_TRACE_IMPORT}")
    message(STATUS "ARG_IS_DEBUG ${ARG_IS_DEBUG}")
    message(STATUS "ARG_NEED_RUN_EVENT_LOOP ${ARG_NEED_RUN_EVENT_LOOP}")
    message(STATUS "ARG_EXECUTABLE_PATH ${ARG_EXECUTABLE_PATH}")

    if ("${ARG_EXECUTABLE_PATH}" STREQUAL "")
        set(ARG_EXECUTABLE_PATH "${CMAKE_CURRENT_BINARY_DIR}/${target}")
        message(STATUS "ARG_EXECUTABLE_PATH ${ARG_EXECUTABLE_PATH}")
    endif()

    set(TRACE_OPT)
    if (${ARG_TRACE_IMPORT})
        set(TRACE_OPT "--trace")
    endif()

    # Collect all project's *.ts source files to enable incremental build
    getProjectFiles("${ARG_PROJECT_ROOT}" "${ARG_ENTRY}" sources)

    getBinaryName("${ARG_ENTRY}" binary_name "${ARG_EXECUTABLE_PATH}")

    makeOutputDir(makeOutputDir_${binary_name} ${ARG_DEP_TARGET} "${ARG_EXECUTABLE_PATH}" "${ARG_ENTRY}" output_dir)

    # TODO: restore verifier
    # verify_ts(verify_ts_${binary_name} makeOutputDir_${binary_name} "${ARG_PROJECT_ROOT}" "${ARG_ENTRY}" "${ARG_BASE_URL}" "${sources}" "${output_dir}")

    extractSymbols(
        extr_std_smbs_${binary_name}
        makeOutputDir_${binary_name}
        "${DEPENDENCIES}"
        "${output_dir}"
        DEPENDENCIES_DEMANGLED_NAMES
        DEPENDENCIES_MANGLED_NAMES
    )

    instantiate_classes(
        inst_cls_${binary_name}
        extr_std_smbs_${binary_name}
        "${ARG_PROJECT_ROOT}"
        "${ARG_ENTRY}"
        "${ARG_TS_CONFIG}"
        "${ARG_BASE_URL}"
        "${sources}"
        "${ARG_INCLUDES}"
        "${output_dir}"
        "${TRACE_OPT}"
        CLASSES_SRC
        "${DEPENDENCIES_DEMANGLED_NAMES}"
        "${DEPENDENCIES_MANGLED_NAMES}"
    )

    compile_cpp(
        cmpl_cls_${binary_name}
        inst_cls_${binary_name}
        "${ARG_INCLUDES}"
        "${ARG_DEFINITIONS}"
        "${CLASSES_SRC}"
        "${output_dir}"
        COMPILED_CLASSES
    )

    extractSymbols(
        extr_cls_smbs_${binary_name}
        cmpl_cls_${binary_name}
        "${COMPILED_CLASSES}"
        "${output_dir}"
        COMPILED_CLASSES_DEMANGLED_NAMES
        COMPILED_CLASSES_MANGLED_NAMES
    )

    list(APPEND DEPENDENCIES_DEMANGLED_NAMES "${COMPILED_CLASSES_DEMANGLED_NAMES}")
    list(APPEND DEPENDENCIES_MANGLED_NAMES "${COMPILED_CLASSES_MANGLED_NAMES}")

    instantiate_functions(
        inst_func_${binary_name}
        extr_cls_smbs_${binary_name}
        "${ARG_PROJECT_ROOT}"
        "${ARG_ENTRY}"
        "${ARG_TS_CONFIG}"
        "${ARG_BASE_URL}"
        "${sources}"
        "${ARG_INCLUDES}"
        "${output_dir}"
        "${DEPENDENCIES_DEMANGLED_NAMES}"
        "${DEPENDENCIES_MANGLED_NAMES}"
        "${TRACE_OPT}"
        FUNCTIONS_SRC
    )

    compile_cpp(
        cmpl_func_${binary_name}
        inst_func_${binary_name}
        "${ARG_INCLUDES}"
        "${ARG_DEFINITIONS}"
        "${FUNCTIONS_SRC}"
        "${output_dir}"
        COMPILED_FUNCTIONS
    )

    list(PREPEND DEPENDENCIES ${COMPILED_CLASSES} ${COMPILED_FUNCTIONS})

    extractSymbols(
        extr_smbs_${binary_name}
        cmpl_func_${binary_name}
        "${DEPENDENCIES}"
        "${output_dir}"
        DEMANGLED_NAMES
        MANGLED_NAMES
    )

    compile_ts(
        compile_ts_${binary_name}
        extr_smbs_${binary_name}
        "${ARG_PROJECT_ROOT}"
        "${ARG_ENTRY}"
        "${ARG_TS_CONFIG}"
        "${ARG_BASE_URL}"
        "${sources}"
        "${DEMANGLED_NAMES}"
        "${MANGLED_NAMES}"
        "${output_dir}"
        "${ARG_IS_PRINT_IR}"
        "${TRACE_OPT}"
        LL_BYTECODE
        "${ARG_IS_DEBUG}"
        "${ARG_NEED_RUN_EVENT_LOOP}"
    )

    compile_ll(
        compile_ll_${binary_name}
        compile_ts_${binary_name}
        "${LL_BYTECODE}"
        "${OPTIMIZATION_LEVEL}"
        "${output_dir}"
        COMPILED_SOURCE
    )

    if(ARG_IS_TEST)
        if (ARG_NEED_RUN_EVENT_LOOP)
            add_compile_definitions(TS_RUN_EVENT_LOOP)
        endif()
        generateSeedForTests(generate_seed_${binary_name} compile_ll_${binary_name} "${output_dir}" SEED_SRC)
        add_test(
            NAME ${binary_name} 
            COMMAND ${binary_name}
            WORKING_DIRECTORY ${CMAKE_CURRENT_BINARY_DIR}/..)
    else()
        generateSeed(generate_seed_${binary_name} compile_ll_${binary_name} "${output_dir}" SEED_SRC)
    endif()

    link(binary_name generate_seed_${binary_name} "${ARG_EXECUTABLE_PATH}" "${SEED_SRC}" "${COMPILED_SOURCE}" "${DEPENDENCIES}")
    set(${target} ${binary_name} PARENT_SCOPE)
endfunction()

macro(build target dep_target entry includes dependencies definitions optimization_level is_test is_printIr trace_import is_debug need_run_event_loop)
    message(DEPRECATION "use add_antiq_executable instead of build")
    if (NOT PROJECT_ROOT)
        message(FATAL_ERROR "PROJECT_ROOT is undefined")
    endif()
    if (NOT TS_CONFIG)
        message(FATAL_ERROR "TS_CONFIG is undefined")
    endif()
    if (NOT PROJECT_BASE_URL)
        message(FATAL_ERROR "PROJECT_BASE_URL is undefined")
    endif()
    if (NOT PROJECT_OUTPUT_BINARY)
        message(FATAL_ERROR "PROJECT_OUTPUT_BINARY is undefined")
    endif()
    add_antiq_executable(${target}
        DEP_TARGET ${dep_target}
        PROJECT_ROOT "${PROJECT_ROOT}"
        ENTRY "${entry}"
        TS_CONFIG "${TS_CONFIG}"
        BASE_URL "${PROJECT_BASE_URL}"
        INCLUDES "${includes}"
        DEPENDENCIES "${dependencies}"
        DEFINITIONS "${definitions}"
        OPTIMIZATION_LEVEL "${optimization_level}"
        IS_TEST "${is_test}"
        IS_PRINT_IR "${is_printIr}"
        TRACE_IMPORT "${trace_import}"
        IS_DEBUG "${is_debug}"
        NEED_RUN_EVENT_LOOP "${need_run_event_loop}"
        EXECUTABLE_PATH "${PROJECT_OUTPUT_BINARY}"
    )
endmacro()

endif() # __ts_build_utils_cmake_guard

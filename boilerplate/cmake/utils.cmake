set(NODE_MODULES "node_modules")

function (get_npm_config_variable_as_string VARIABLE_NAME)
    set(NPM_PACKAGE_CONFIG_PREFIX "npm_package_config_")

    if (NOT DEFINED ENV{${NPM_PACKAGE_CONFIG_PREFIX}${VARIABLE_NAME}})
        message(FATAL_ERROR "${VARIABLE_NAME} is not set in project package.json nor by npm config set")
    endif()

    set(${VARIABLE_NAME} $ENV{${NPM_PACKAGE_CONFIG_PREFIX}${VARIABLE_NAME}} PARENT_SCOPE)
endfunction()

function (get_npm_config_variable_as_string_optional VARIABLE_NAME)
    set(NPM_PACKAGE_CONFIG_PREFIX "npm_package_config_")

    if (DEFINED ENV{${NPM_PACKAGE_CONFIG_PREFIX}${VARIABLE_NAME}})
        set(${VARIABLE_NAME} $ENV{${NPM_PACKAGE_CONFIG_PREFIX}${VARIABLE_NAME}} PARENT_SCOPE)
    else()
        set(${VARIABLE_NAME} "NOT-DEFINED" PARENT_SCOPE)
    endif()

endfunction()

function(get_npm_config_variable_as_bool VARIABLE_NAME)
    get_npm_config_variable_as_string(${VARIABLE_NAME})
    set(result ${${VARIABLE_NAME}})

    if (NOT "${result}" STREQUAL "")
        string(TOLOWER ${result} result)
        if ("${result}" STREQUAL "true")
            set(result TRUE)
        else()
            set(result FALSE)
        endif()
    else()
        set(result FALSE)
    endif()

    set(${VARIABLE_NAME} ${result} PARENT_SCOPE)
endfunction()

function(get_npm_config_variable_as_bool_optional VARIABLE_NAME DEFAULT_VALUE)
    get_npm_config_variable_as_string_optional(${VARIABLE_NAME})

    set(result ${${VARIABLE_NAME}})

    if (result)
        string(TOLOWER ${result} result)
        if ("${result}" STREQUAL "true")
            set(result TRUE)
        else()
            set(result ${DEFAULT_VALUE}) # NOT-DEFINED
        endif()
    else()
        set(result FALSE)
    endif()

    set(${VARIABLE_NAME} ${result} PARENT_SCOPE)
endfunction()

macro(set_build_type)
    get_npm_config_variable_as_string(BUILD_TYPE)
    set(CMAKE_BUILD_TYPE ${BUILD_TYPE})
endmacro()

macro(set_tsnative_version)
    get_npm_config_variable_as_string(TSNATIVE_VERSION)
endmacro()

macro(set_print_ir)
    get_npm_config_variable_as_bool_optional(PRINT_IR FALSE)
endmacro()

macro(set_trace_import)
    get_npm_config_variable_as_bool_optional(TRACE_IMPORT FALSE)
endmacro()

macro(set_opt_level)
    get_npm_config_variable_as_string_optional(OPT_LEVEL)
    if (DEFINED OPT_LEVEL)
        if (NOT "${OPT_LEVEL}" STREQUAL "")
            string(REGEX MATCH "^\-O[0-3]$" OPT_LEVEL ${OPT_LEVEL})
            if ("${OPT_LEVEL}" STREQUAL "")
                set(OPT_LEVEL "-O3")
            endif()
        else()
            set(OPT_LEVEL "-O3")
        endif()
    else()
        set(OPT_LEVEL "-O3")
    endif()
endmacro()

macro(set_enable_optimization)
    get_npm_config_variable_as_bool_optional(ENABLE_OPTIMIZATIONS TRUE)
endmacro()

macro(prepare_conan_profiles)
    get_npm_config_variable_as_string(CONAN_PROFILE_BUILD)
    get_npm_config_variable_as_string(CONAN_PROFILE_HOST)

    execute_process(
        COMMAND conan profile get settings.target_abi "${CONAN_PROFILE_HOST}"
        RESULT_VARIABLE CONAN_GET_TARGET_ABI_RESULT
        OUTPUT_VARIABLE CONAN_TARGET_ABI
        OUTPUT_STRIP_TRAILING_WHITESPACE
    )
    if (CONAN_GET_TARGET_ABI_RESULT)
        message(FATAL_ERROR "Unable to get target_abi value from profile ${CONAN_PROFILE_HOST}")
    endif()
    set(CMAKE_CXX_COMPILER_TARGET ${CONAN_TARGET_ABI})
endmacro()

macro(prepare_tsnative LIB_NAME)
    set(TSNATIVE_OUTPUT_LIBRARY_NAME ${LIB_NAME}_tsn_lib)

    find_package(tsnative-std REQUIRED)

    get_filename_component(tsnative-std_ROOT "${tsnative-std_INCLUDE_DIR}/.." ABSOLUTE) # TODO: remove dirty hack
    set(TS_COMPILER_ENV "NODE_PATH=${tsnative-std_ROOT}/declarations/tsnative")

    include(TsBuildUtils2)
    include(TsDeclaratorUtils)

    set(TSNATIVE_OUTPUT_LIBS ${TSNATIVE_OUTPUT_LIBRARY_NAME};)

    get_npm_config_variable_as_bool_optional(TSNATIVE_USE_CUSTOM_SEED FALSE)

    if(NOT ${TSNATIVE_USE_CUSTOM_SEED})
        list(PREPEND TSNATIVE_OUTPUT_LIBS ${TSNATIVE_OUTPUT_LIBRARY_NAME}_main)
    endif()

    set(PROJECT_BASE_URL ${CMAKE_CURRENT_BINARY_DIR})

    set_property(GLOBAL PROPERTY TSNATIVE_CXX_EXTENSION_LIBRARIES "")

    file(MAKE_DIRECTORY ${NODE_MODULES})
endmacro()

macro(copy_tsnative_std_to_node_modules target)
    set(src "${tsnative-std_ROOT}/declarations/tsnative")
    copy_to_node_modules_before_build(${target} ${src} tsnative)
endmacro()

macro(copy_to_node_modules_before_build target src dest)
    set(finalDest "${CMAKE_SOURCE_DIR}/${NODE_MODULES}/${dest}")

    string(RANDOM UNIQUE_SUFFIX)
    get_filename_component(COPY_TARGET ${dest} NAME)
    set(COPY_TARGET "copy_${COPY_TARGET}_to_node_modules__${UNIQUE_SUFFIX}")

    add_custom_target(
        ${COPY_TARGET}
        COMMAND cmake -E copy_directory ${src} ${finalDest}
        COMMENT "Copy ${src} to node_modules"
    )

    set(${target} ${COPY_TARGET})
endmacro()

macro(copy_to_node_modules_after_build target src dest)
    set(finalDest "${CMAKE_SOURCE_DIR}/${NODE_MODULES}/${dest}")

    add_custom_command(
        TARGET ${target}
        POST_BUILD
        COMMAND cmake -E copy_directory ${src} ${finalDest}
        COMMENT "Copy ${src} to node_modules"
    )
endmacro()

function(get_extensions_list OUTPUT)
    get_property(LIBS GLOBAL PROPERTY TSNATIVE_CXX_EXTENSION_LIBRARIES)
    set(${OUTPUT} ${LIBS} PARENT_SCOPE)
endfunction()

function(add_extension EXTENSION)
    get_property(EXTENSION_LIBRARIES GLOBAL PROPERTY TSNATIVE_CXX_EXTENSION_LIBRARIES)
    list(APPEND EXTENSION_LIBRARIES ${EXTENSION})
    set_property(GLOBAL PROPERTY TSNATIVE_CXX_EXTENSION_LIBRARIES ${EXTENSION_LIBRARIES})
endfunction()

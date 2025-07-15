cmake_minimum_required(VERSION 3.10)

project(tsnative-test LANGUAGES CXX)

find_package(tsnative-declarator REQUIRED CONFIG)
find_package(tsnative-std REQUIRED CONFIG)

include(TsDeclaratorUtils)

macro(_requiredArgs ...)
    foreach(arg ${ARGV})
        if (NOT DEFINED ${arg})
            message(FATAL_ERROR "Missing required argument: ${arg}")
        endif()
    endforeach()
endmacro()

macro(_requiredVar var)
    if (NOT DEFINED ${var})
        message(FATAL_ERROR "Missing required variable: ${var}")
    endif()

    message(STATUS "${var}=${${var}}")
endmacro()

macro(_printVar var)
    message(STATUS "${var}=${${var}}")
endmacro()

function(runScenario target dep_target ...)
    cmake_parse_arguments(PARSE_ARGV 2 "ARG"
    ""
    "SCENARIO_NAME;TARGET_COMPILER_ABI;IMPORT;NO_IMPORT_STD;IGNORE_ERROR;OUTPUT_DIR"
    ""
    )

    if (ARG_UNPARSED_ARGUMENTS)
        message (FATAL_ERROR "Unknown arguments: ${ARG_UNPARSED_ARGUMENTS}")
    endif()

    _requiredArgs(ARG_SCENARIO_NAME ARG_TARGET_COMPILER_ABI)

    set(outputs )
    set(outputDir "${CMAKE_CURRENT_BINARY_DIR}/out/declarator/${ARG_SCENARIO_NAME}")

    file(GLOB headers
        "${SCENARIOS_DIR}/${ARG_SCENARIO_NAME}/input/*.h"
    )

    file(GLOB snippets
        "${SCENARIOS_DIR}/${ARG_SCENARIO_NAME}/output/*.d.ts"
        "${SCENARIOS_DIR}/${ARG_SCENARIO_NAME}/output/*.err"
    )

    set(tempDir "${CMAKE_CURRENT_BINARY_DIR}/temp/declarator/${target}")
    set(outputsFile "${tempDir}/outputs.txt")
    set(snippetsFile "${tempDir}/snippets.txt")

    # add_custom_command's target
    add_custom_target(compare_${target})

    add_dependencies(${dep_target} compare_${target})

    # ts_generate_declarations's target
    add_custom_target(${target})

    set_target_properties(${target} PROPERTIES
        TS_NO_IMPORT_STD "${ARG_NO_IMPORT_STD}"
    )

    ts_generate_declarations(${target}
        TS_HEADERS ${headers}
        TS_IMPORT "${ARG_IMPORT}"
        TARGET_COMPILER_ABI "${ARG_TARGET_COMPILER_ABI}"
        OUTPUT_DIR "${outputDir}"
        IGNORE_ERROR "${ARG_IGNORE_ERROR}"
        NO_HEAD "true"
        OUT_DECLARATIONS outputs
    )

    add_dependencies(compare_${target} ${target})

    # run comparator
    set(variables 
        "SCENARIO=\"${target}\" \
        SCENARIOS_DIR=\"${SCENARIOS_DIR}\" \
        OUTPUTS_FILE=\"${outputsFile}\" \
        SNIPPETS_FILE=\"${snippetsFile}\""
    )

    set(command "${variables} ${SOURCE_DIR}/src/declarator/comparator.py")

    add_custom_command(
        TARGET compare_${target} POST_BUILD
        COMMAND echo "Run comparator..."
        COMMAND sh -c "mkdir -p ${tempDir}"
        COMMAND echo "${outputs}" >> ${outputsFile}
        COMMAND echo "${snippets}" >> ${snippetsFile}
        VERBATIM COMMAND sh -c "${command}"
    )

endfunction()

function(runIndexScenario target dep_target ...)
    cmake_parse_arguments(PARSE_ARGV 2 "ARG"
    ""
    "SCENARIO_NAME"
    ""
    )

    if (ARG_UNPARSED_ARGUMENTS)
        message (FATAL_ERROR "Unknown arguments: ${ARG_UNPARSED_ARGUMENTS}")
    endif()

    _requiredArgs(ARG_SCENARIO_NAME)

    # add_custom_command's target
    add_custom_target(compare_${target})

    add_dependencies(${dep_target} compare_${target})

    # ts_generate_declarations's target
    add_custom_target(${target})

    set(declarationList
        "One.d.ts"
        "Two.d.ts"
        "Three.d.ts"
        "Four.d.ts"
    )

    set(outputDir "${CMAKE_CURRENT_BINARY_DIR}/out/declarator")
    set(outputs 
        "${outputDir}/index.ts"
    )
    set(snippets 
        "${SCENARIOS_DIR}/${ARG_SCENARIO_NAME}/output/index.ts"
    )

    set(tempDir "${CMAKE_CURRENT_BINARY_DIR}/temp/declarator/${target}")
    set(outputsFile "${tempDir}/outputs.txt")
    set(snippetsFile "${tempDir}/snippets.txt")

    ts_generate_index(${target}
        DECLARATIONS ${declarationList}
        EXPORTED_NAME "index_test"
        MODULE_NAME "test"
        NO_HEAD "true"
        OUT_DIRECTORY ${outputDir}
    )

    add_dependencies(compare_${target} ${target})

    # run comparator
    set(variables 
        "SCENARIO=\"${target}\" \
        SCENARIOS_DIR=\"${SCENARIOS_DIR}\" \
        OUTPUTS_FILE=\"${outputsFile}\" \
        SNIPPETS_FILE=\"${snippetsFile}\""
    )
    
    set(command "${variables} ${SOURCE_DIR}/src/declarator/comparator.py")
    
    add_custom_command(
        TARGET compare_${target} POST_BUILD
        COMMAND echo "Run comparator..."
        COMMAND sh -c "mkdir -p ${tempDir}"
        COMMAND echo "${outputs}" >> ${outputsFile}
        COMMAND echo "${snippets}" >> ${snippetsFile}
        VERBATIM COMMAND sh -c "${command}"
    )

endfunction()

# convert paths to cmake style (needs for windows)
file(TO_CMAKE_PATH "${SOURCE_DIR}" SOURCE_DIR)
file(TO_CMAKE_PATH "${TSNATIVE_DECLARATOR_INCLUDE_DIR}" TSNATIVE_DECLARATOR_INCLUDE_DIR)

# passed from conanfile
_requiredVar(SOURCE_DIR)
_requiredVar(CMAKE_CXX_COMPILER_TARGET)
_requiredVar(TSNATIVE_DECLARATOR_INCLUDE_DIR)

set(SCENARIOS_DIR
    "${SOURCE_DIR}/src/declarator/scenarios"
)

_printVar(SCENARIOS_DIR)

add_custom_target(build_anyway ALL)

runScenario(ok_scenario_target build_anyway
    SCENARIO_NAME "ok"
    TARGET_COMPILER_ABI "${CMAKE_CXX_COMPILER_TARGET}"
    NO_IMPORT_STD "true"
    IGNORE_ERROR "false"
)

runScenario(fail_scenario_target ok_scenario_target
    SCENARIO_NAME "fail"
    TARGET_COMPILER_ABI "${CMAKE_CXX_COMPILER_TARGET}"
    NO_IMPORT_STD "true"
    IGNORE_ERROR "true"
)

runScenario(import_std_scenario_target fail_scenario_target
    SCENARIO_NAME "import_std"
    TARGET_COMPILER_ABI "${CMAKE_CXX_COMPILER_TARGET}"
    NO_IMPORT_STD "false"
    IGNORE_ERROR "false"
)

runScenario(no_import_std_scenario_target import_std_scenario_target
    SCENARIO_NAME "no_import_std"
    TARGET_COMPILER_ABI "${CMAKE_CXX_COMPILER_TARGET}"
    NO_IMPORT_STD "true"
    IGNORE_ERROR "false"
)

runScenario(import_scenario_target no_import_std_scenario_target
    SCENARIO_NAME "import"
    TARGET_COMPILER_ABI "${CMAKE_CXX_COMPILER_TARGET}"
    NO_IMPORT_STD "true"
    IMPORT "import { M1 } from \'path/to/M1\'; import { M2 } from \'path/to/M2\'"
    IGNORE_ERROR "false"
)

runIndexScenario(index_target import_scenario_target
    SCENARIO_NAME "index"
)
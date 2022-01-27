#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

set (EXTS_TARGET test_app_ext)

set (SOURCES "${CMAKE_CURRENT_LIST_DIR}/Ext.cpp")
set (HEADERS "${CMAKE_CURRENT_LIST_DIR}/Ext.h")

ts_build_extension ( ${EXTS_TARGET}
    SOURCES ${SOURCES} ${HEADERS}
    INCLUDE_PATHS ${CMAKE_CURRENT_SOURCE_DIR}
)

# target_link_libraries(${EXTS_TARGET} ...... )
# target_include_directories(${EXTS_TARGET} ...... )

# TODO: add cpp extension using declarator
# ts_generate_declarations(${EXTS_TARGET} 
#     HEADERS ${HEADERS}
# )


# # MANDATORY for now
# list(APPEND EXTRA_DEPENDENCIES
  
# )
# set_target_properties(${TS_EXTENSION_TARGET} PROPERTIES
#   EXTRA_DEPENDENCIES "${EXTRA_DEPENDENCIES}"
# )



# target_include_directories(${TS_EXTENSION_TARGET}
#     PRIVATE
#         ${StdLib_INCLUDE_DIR}
#         "${declarator_NODE_INCLUDE_DIRS}"
# )



# set_target_properties(${TS_EXTENSION_TARGET} PROPERTIES
#   INCLUDES "${CMAKE_CURRENT_LIST_DIR}"
# )




# list(APPEND LIBRARY_DEPENDENCIES
#     ${MgtTs_LIBRARY}
#     ${common_LIBRARY}
# )

# set_target_properties(${TS_EXTENSION_TARGET} PROPERTIES
#   LIBRARY_DEPENDENCIES "${LIBRARY_DEPENDENCIES}"
# )

# list(APPEND HEADER_DEPENDENCIES 
#   "${StdLib_INCLUDE_DIR}"
#   "${declarator_NODE_INCLUDE_DIRS}"
# )

# set_target_properties(${TS_EXTENSION_TARGET} PROPERTIES
#   HEADER_DEPENDENCIES "${HEADER_DEPENDENCIES}"
# )

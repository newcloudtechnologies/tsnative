#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2022
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

include(GNUInstallDirs)

add_custom_command(
        OUTPUT ${output}
        WORKING_DIRECTORY ${PROJECT_DIR}
        COMMAND echo "Packaging verifier"
        COMMAND pkg
        ARGS ${entry}    --output ${CMAKE_INSTALL_BINDIR}/verifier
        )
        # DEPENDS ${entry} ${sources}
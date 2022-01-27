#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

cmake_minimum_required(VERSION 3.10)

project(tsnative LANGUAGES CXX)

add_subdirectory(declarator)

# add_custom_target(pkg DEPENDS compiler_pkg verifier_pkg)

install(
    FILES       tsnative.sh
    PERMISSIONS OWNER_EXECUTE OWNER_WRITE OWNER_READ
    DESTINATION "."
)

install(
    FILES       tsconfig.json package.json
    DESTINATION "."
)

install(
    DIRECTORY   cmake
    DESTINATION "."
)

# TODO: try configure_package_config_file
install(
    FILES       ${PROJECT_NAME}-config.cmake tsconfig.json
    DESTINATION "cmake"
)

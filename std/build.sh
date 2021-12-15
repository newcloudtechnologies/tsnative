#!/bin/sh
#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

echo "Building std..."

CURRENT_DIR=$(cd `dirname $0` && pwd)
BUILD_DIR="${CURRENT_DIR}/../out/libtsnative-std/build"
OUTPUT_DIR="${CURRENT_DIR}/lib"

mkdir -p ${BUILD_DIR}
mkdir -p ${OUTPUT_DIR}

# BUILD_DIR=$(readlink -f ${BUILD_DIR})
# OUTPUT_DIR=$(readlink -f ${OUTPUT_DIR})

cmake -G "Unix Makefiles" \
    -B ${BUILD_DIR} \
    -S ${CURRENT_DIR} \
    -DCMAKE_OSX_ARCHITECTURES=arm64 \
    -DCMAKE_OSX_SYSROOT=/Users/antiq/Downloads/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk \
    -DCMAKE_ARCHIVE_OUTPUT_DIRECTORY=${OUTPUT_DIR} \
    -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON

cd ${BUILD_DIR} && make -j$(sysctl -n hw.ncpu)


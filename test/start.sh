#!/bin/bash
#
# Copyright (c) New Cloud Technologies, Ltd., 2014-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

echo "Starting test..."

CURRENT_DIR=$(cd `dirname $0` && pwd)
BUILD_DIR="${CURRENT_DIR}/../out/test/build"

rm -rf ${BUILD_DIR}
mkdir -p ${BUILD_DIR}

BUILD_DIR=$(readlink ${BUILD_DIR})
if [ "$(uname -s)" == "Darwin" ]; then
    MACOS_SYSROOT="$(xcode-select -print-path)/Platforms/MacOSX.platform/Developer/SDKs/MacOSX.sdk"
fi

tsc
npm run build

cmake -G "Unix Makefiles" \
    -B ${BUILD_DIR} \
    -S ${CURRENT_DIR} \
    -DCMAKE_OSX_SYSROOT=${MACOS_SYSROOT} \
    -DCMAKE_BUILD_TYPE=Release \
    -DPROJECT_DIR=${CURRENT_DIR} \
    -DSTAGE_DIR=${BUILD_DIR} \
    -DBUILD=${BUILD_DIR}

cd ${BUILD_DIR} && make $JOBS && make test

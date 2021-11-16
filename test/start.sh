#!/bin/bash
#
# Copyright (c) New Cloud Technologies, Ltd., 2013-2021
#
# You can not use the contents of the file in any way without
# New Cloud Technologies, Ltd. written permission.
#
# To obtain such a permit, you should contact New Cloud Technologies, Ltd.
# at http://ncloudtech.com/contact.html
#

echo "Start test..."

CURRENT_DIR=$(cd `dirname $0` && pwd)

cd ${CURRENT_DIR}
rm -rf build
mkdir build

tsc
npm run build

cmake -G "Unix Makefiles" \
    -B ${CURRENT_DIR}/build \
    -S ${CURRENT_DIR} \
    -DCMAKE_BUILD_TYPE=release \
    -DPROJECT_DIR=${CURRENT_DIR} \
    -DSTAGE_DIR=${CURRENT_DIR}/build \
    -DBUILD=${CURRENT_DIR}/build

cd build
make $JOBS
make test


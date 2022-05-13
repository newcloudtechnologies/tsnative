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

echo "Starting playground..."

echo "Args: $@"

CURRENT_DIR=$(cd `dirname $0` && pwd)

TSNATIVE=${CURRENT_DIR}/out/install/tsnative.sh

if [ ! -f "$TSNATIVE" ]; then
    echo "Cannot find $TSNATIVE. Did you forget to build compiler?"
    exit 1;
fi

${TSNATIVE} --tsnative_root ${CURRENT_DIR}/out/install \
            --project_root ${CURRENT_DIR} \
            --build ${CURRENT_DIR}/out/build/playground \
            $@
#!/bin/bash

# export tsnative="$(pwd)/../../out/install/tsnative.sh"

$(pwd)/../../out/install/tsnative.sh \
    --tsnative_root $(pwd)/../../out/install \
    --project_root $(pwd) \
    --source $(pwd)/src/main.ts \
    --extension $(pwd)/cpp \
    --tsconfig $(pwd)/tsconfig.json --build $(pwd)/../../out/build/test_app

# npm run build
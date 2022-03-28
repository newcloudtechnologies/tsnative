# TS Declarator

Needs to create declarations from C++ headers.

**Build**
```
mkdir -p build && cd build && cmake -DCMAKE_BUILD_TYPE=Debug .. && make -j8
```

**Dependencies**
apt install libllvm11 libllvm-11-ocaml-dev libclang1-11 libclang-11-dev

**Options**
- *-x c++* - C++ is used
- *--target=x86_64-linux-gnu* - specify target architecture
- *-D TS* - define TS in translation unit (needs to use TS_* macros)
- */home/silart/Projects/CBE/packages/mgt/ui/include/ui/Button.h* - file of translation unit
- *-I path* - include pathes

**Environment variables**
- *DECLARATOR_OUTPUT_DIR* - output dir path (directory for generated declarations)
- *DECLARATOR_IMPORT* - specify import (dot separated list), e.g: 
`"import { mgt } from 'mgt/declarations';import { ts } from 'mgt/ts/declarations'"`
- *DECLARATOR_TEMP_DIR* - specify temp directory where declarator creates template instantiation

**Example**
```
DECLARATOR_OUTPUT_DIR=\"path/to/ts_stage/extensions/declarations\" \
DECLARATOR_IMPORT=\"import { ts } from 'mgt/declarations'\" \
DECLARATOR_TEMP_DIR=\"path/to/build/tmp\" \
tsnative/bin/declarator -x c++ --target=x86_64-linux-gnu  -DTS path/to/app/extensions/MyClass.h -I/path/to/include/directory -I/path/to/another/include/directory
```

**Import format**
Import signature in similar to TypeScript:

```
import { mgt } from 'mgt/declarations'
```
It is possible to use single quotes and double quotes but in cmake double quotes don't work.

**Possible issues**
If declarator can't find any C++ header, make sure includes order is correct. Usually first include is "packages/mgt/common/include" which contains TS.h file.

**Tests**
Run declarator tests: npm run declarator_test

Each generated declaration compares with approprite snippet.
Declarations generate path: tsnative/out/build/declarator/test/declarations
Snippets path: tsnative/declarator/test/snippets/(ok|fail)

Ok snippets mean tests passed expected. Fail snippets: tests must be failed.

To add new test you should to create header file and appropriate declaration in snippets dir.

To update any snippet you should to run tests, review header and appropriate generated declaration,
copy generated declaration snippets dir.
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
- *DECLARATOR_IMPORT* - specify import (dot separated list) Example: "VTable:std-typescript-llvm/decorators/decorators,TSClosure:std-typescript-llvm/definitions/lib.std.utils"

**Example**

```
DECLARATOR_OUTPUT_DIR=/path/to/outputdir DECLARATOR_IMPORT=VTable:std-typescript-llvm/decorators/decorators,TSClosure:std-typescript-llvm/definitions/lib.std.utils declarator -x c++ --target=x86_64-linux-gnu -D TS /home/silart/Projects/CBE/packages/mgt/ui/include/ui/Button.h -I /home/silart/Projects/CBE/packages/mgt/common/include -I /home/silart/Projects/CBE/out/linux/x86_64/release/STAGE/include/mgt_ui -I /home/silart/Projects/CBE/out/linux/x86_64/release/STAGE/include/mgt_window -I /home/silart/Projects/CBE/out/linux/x86_64/release/STAGE/include/mgt_app -I /home/silart/Projects/CBE/out/linux/x86_64/release/STAGE/include/mgt_graphics -I /home/silart/Projects/CBE/out/linux/x86_64/release/STAGE/include/mgt_graphics/graphics -I /home/silart/Projects/CBE/out/linux/x86_64/release/STAGE/include/mgt_signals -I /home/silart/Projects/CBE/out/linux/x86_64/release/STAGE/include/mgt_bpl -I /home/silart/Projects/CBE/out/linux/x86_64/release/STAGE/include/mgt_ui/ui
```

**Import format**

Item of import list *VTable:std-typescript-llvm/decorators/decorators* generates folowing code in declaration:

```
import { VTable } from "std-typescript-llvm/decorators/decorators"
```

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


# TSNative Boilerplate Project

This boilerplate provides a scaffold for building applications based on TSNative.

## Prerequisites

You need to have `cmake`, `npm`, and `conan` installed on your system.

## Getting Started

In the **config** section of the root `package.json`, the following parameters are defined:

- `TSNATIVE_VERSION` — the exact version of TSNative used to build the project. Only fixed versions are supported, version ranges are not allowed.
- `BUILD_TYPE` — build type. Acceptable values are the same as those for [CMAKE_BUILD_TYPE](https://cmake.org/cmake/help/latest/variable/CMAKE_BUILD_TYPE.html)
- `CONAN_PROFILE_BUILD` — Conan profile for the build platform
- `CONAN_PROFILE_HOST` — Conan profile for the target platform
- `TSNATIVE_USE_CUSTOM_SEED` — use custom application entry point (from tsnative or user-defined)


Supported platforms and corresponding profiles:

| Platform           | CONAN_PROFILE_BUILD            | CONAN_PROFILE_HOST             |
| :----------------- | :----------------------------- | :----------------------------- |
| Linux: x86_64      | linux_x86_64_gcc9              | linux_x86_64_gcc9              |


## C++ Code (Extensions)

It is **recommended** to place C++ code callable from TypeScript in the `cxx` directory.

Exported classes and functions must be marked with the appropriate macros from `TS.h`.

In `CMakeLists.txt`, you must:

- Use the **ts_generate_declarations** function to generate `.d.ts` declaration files to be imported in TypeScript code
- Register the extension with the **add_extension** macro
- Copy the generated declarations using the **copy_to_node_modules** macro

## Build

To build the project:

```bash
npm run build
```

The output artifact will be located at:

```
<project_root>/out/<cmake_project_name>
```

To clean the project:

```bash
npm run clean
```

To rebuild the project:

```bash
npm run rebuild
```

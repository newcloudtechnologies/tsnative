# tsnative

> A cross-platform AOT compiler that enables running TypeScript as native code via LLVM.  
It targets developers who want the **ergonomics of TypeScript** with the **performance of C++**.

## 🔹 About

Key features:
- **C++ integration** — seamless calls between TS and C++ with no glue code
- **System-level abstractions** — GC, EventLoop, and runtime APIs
- **Custom subset implementation of ECMAScript**
- **AOT compilation via LLVM** — no interpreter or JS engine
- Platform support: **Linux**

Target audience:
- Web developers looking to run TypeScript outside the browser
- C++ developers aiming to speed up business logic development without sacrificing performance

## 🎯 Goals

- Provide **seamless integration** between TypeScript and C++ in a single application
- Enable **bidirectional debugging** of both TS and C++ code
- Support **as many platforms as possible**
- Maintain compatibility with:
  - TypeScript ≥ 4.5
  - ECMAScript ≥ 2016
  - C++ ≥ 14

## 🚀 Quick Start

Use the prebuilt Docker image with all dependencies and compiled project:

```bash
# pull the image
docker pull ghcr.io/newcloudtechnologies/tsnative:latest
# run it
docker run -it ghcr.io/newcloudtechnologies/tsnative
# build the sample project
cd boilerplate/
npm run build
```

You can also build the image locally from source:

```bash
docker build -t tsnative .
docker run -it tsnative
```

## 📦 Dependencies

Clone the repository:

```bash
git clone --depth 1 --branch master git@github.com:newcloudtechnologies/tsnative.git
cd tsnative
```

Install system dependencies:

```bash
./scripts/setup.sh
```

Install Conan settings and profiles:

```bash
conan config install ./settings.yml
conan config install -tf profiles ./profiles/linux_x86_64_gcc9
conan config install -tf profiles ./profiles/linux_x86_64_gcc9_debug
```

## 🛠️ Build

Build third-party dependencies:

```bash
conan create 3rdparty/zlib 1.2.12@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/llvm 11.1.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/abseil 20211102.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/gtest 1.11.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/libuv 1.43.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/graphvizlib 1.0.0@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create 3rdparty/llvm-node 3.0.9@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
```

Build main packages:

```bash
conan create declarator/ 0.3@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
conan create std/ 0.3@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9 -o build_tests=True -o enable_logs=all
conan create compiler/ 0.3@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9
```

## 🧪 Tests

```bash
# -o runmode and -o test_filter are optional
conan create test/ 0.3@ -pr:b linux_x86_64_gcc9 -pr:h linux_x86_64_gcc9 -o run_mode=compile -o test_filter=for
```

## 📁 Example

The [`boilerplate`](./boilerplate) folder contains a test project demonstrating tsnative usage.

Basic commands:

```bash
npm run build    # build
npm run clean    # clean artifacts
npm run rebuild  # rebuild
```

The compiled binary will be located at: `boilerplate/out/<cmake_project_name>`

## 🔧 How it works?

The project consists of 3 parts.
1. std library. This is where TS standard library is implemented.
2. declarator. This thing allows generation of .dts files from C++ code.
3. tsnative compiler. It looks into TS code and generates LLVM IR. It also matches ts calls with C++ calls from C++ libraries like TS native.

Compiler's output is LLVM IR and then it compiled via LLVM into a platform executable file.

## ⚠️ Limitations

The project implements a subset of TypeScript and has certain limitations when integrating with C++.  
A summary is available in [LIMITATIONS.md](./LIMITATIONS.md)

## 🤝 Contributing

We welcome all contributions — code, tests, docs, or ideas.  
Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting changes.

## ❓ Support
We've [a telegram channel](https://t.me/antiqmyoffice) to support, please, join and send your question.

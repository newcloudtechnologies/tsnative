from conan import ConanFile
from conan.tools.cmake import CMake
from conan.tools.cmake import CMakeDeps
from conan.tools.cmake import CMakeToolchain
from conan.tools.files import copy, load, save

from pathlib import Path
import os, re, shutil, time

def pkg_suffix(self):
    if self._conan_user and self._conan_channel:
        return "%s@%s/%s" % (self.version, self.user, self.channel)
    else:
        return "%s" % self.version

class TSNativeTestsConan(ConanFile):
    name = "tsnative-tests"
    settings = "os", "compiler", "build_type", "arch", "target_abi"
    generators = "cmake_find_package", "cmake_paths", "CMakeDeps"

    options = {
        "run_mode": ["compile", "runtime", "declarator", "all"],
        "test_filter": 'ANY',
        "opt_level" : [0, 1 , 2, 3],
        "verbose" : [True, False],
        "print_ir" : [True, False],
        "trace_import" : [True, False],
        "profile_build" : [True, False],
    }

    default_options = {
        "run_mode": "all",
        "test_filter": ".*",
        "opt_level" : 2,
        "verbose": False,
        "print_ir" : False,
        "trace_import" : False,
        "profile_build" : False,
    }

    def requirements(self):
        self.requires("tsnative-std/%s" % pkg_suffix(self))

    def build_requirements(self):
        self.build_requires("tsnative-declarator/%s" % pkg_suffix(self))
        self.build_requires("tsnative-compiler/%s" % pkg_suffix(self))

    def export_sources(self):
        self.copy("*")

    def import_ts(self):
        ts_std_dep = self.dependencies["tsnative-std"]
        copy(self, "*.ts", ts_std_dep.cpp_info.builddirs[0], os.path.join(self.build_folder, "imports"))

    def generate(self):
        self.import_ts()

        # TODO: check if os.path.as_posix() works
        to_unix = lambda path: path.replace("\\", "/") #tools.unix_path(path, path_flavor="MSYS2")

        # By default, the generator is 'MinGW Makefiles' on windows but it breaks some paths
        tc = CMakeToolchain(self, generator="Unix Makefiles")
        tc.variables["CMAKE_CXX_COMPILER_TARGET"] = str(self.settings.target_abi)

        if (self.options.verbose):
            tc.variables["CMAKE_VERBOSE_MAKEFILE"]="ON"

        # Variables for compiled tests
        tc.variables["PROJECT_BASE_URL"] = to_unix(os.path.join(self.build_folder, "imports", "declarations"))
        tc.variables["IS_TEST"] = True
        tc.variables["RUN_EVENT_LOOP"] = "oneshot"

        if self.settings.get_safe("build_type") == "Debug":
            tc.variables["TS_DEBUG"] = True

        tc.variables["PRINT_IR"] = bool(self.options.print_ir)
        tc.variables["TRACE_IMPORT"] = bool(self.options.trace_import)
        tc.variables["TS_PROFILE_BUILD"] = bool(self.options.profile_build)
        tc.variables["OPT_LEVEL"] = "-O%s" % self.options.opt_level

        # Variables for declarator tests
        tc.variables["SOURCE_DIR"] = to_unix(self.source_folder)

        print("TOOLCHAIN VARIABLES:\n\t" +
              "\n\t".join(f"{k}={v}" for k, v in tc.variables.items()))

        tc.generate()

        cmake = CMakeDeps(self)
        cmake.build_context_activated = ["tsnative-declarator"]
        cmake.generate()

    # TODO: filter for runtime tests
    def buildRuntimeTests(self):
        self.setup_npm()
        filter_opt=""
        if self.options.test_filter != self.default_options["test_filter"]:
            filter_opt="--test_filter %s" % self.options.test_filter

        # excludes

        excludes = [] # nothing to exclude for now
        excludes_opt=""
        if (excludes):
            excludes_opt="--exclude "
            for e in excludes: excludes_opt += "%s:" % e
            excludes_opt=excludes_opt[:-1]
        print(excludes_opt)
        self.run("npx ts-node src/compiler/runtime_test.ts {}{}".format(filter_opt, excludes_opt))

    def buildDeclaratorTests(self):
        cmake = CMake(self)
        cmake.configure(build_script_folder=os.path.join("src", "declarator"))
        cmake.build()

    def buildCompiledTests(self):
        src_path = Path("src/compiler/cases")
        out_dir = "compiler_tests"
        # first - build pure ts tests
        excludes = [".d.ts", "cpp_integration"]
        if self.settings.os == "Windows":
            excludes.append("exceptions.ts")   # FIXME: TSN-65
            excludes.append("date.ts"      )   # FIXME: TSN-163
            excludes.append("inher.ts"     )   # FIXME: TSN-164
            excludes.append("runtime.ts"   )   # FIXME: TSN-165
            excludes.append("promises.ts"  )   # FIXME: TSN-65

        def in_excludes(path: str):
            for ex in excludes:
                # print("Test [%s] and [%s]" % (ex, path))
                if ex in str(path):
                    self.output.warn("Excluding test %s" % path)
                    return True

        cases = list(filter(lambda x: not in_excludes(x), src_path.rglob('*.ts')))

        test_filter = re.compile(str(self.options.test_filter))
        def apply_filter(in_list: list, pattern = test_filter):
            return list(filter(lambda x: pattern.search(str(x)), in_list))

        cases = apply_filter(cases)

        # print(cases)

        # For pure ts code we use CMakeLists.txt located in compiler package folder
        for require, dependency in self.dependencies.items():
            if "tsnative-compiler" in dependency.ref:
                compiler_pkg_dir = dependency.package_folder
                break

        t = time.time()
        for case in cases:
            self.output.info("==== Compiling %s" % case)
            # CMake class doesn't provide explicit option to control build dir path
            # so hack it a little bit
            self.folders.build = os.path.join(out_dir, case.name)
            cmake = CMake(self)
            cmake.configure(
                variables={
                    "PROJECT_ENTRY_NAME": case.resolve(),
                    "TS_CONFIG" : "tsconfig.json"
                },
                build_script_folder=compiler_pkg_dir
            )
            cmake.build()

        # build ts-cpp intgration tests
        cpp_tests = apply_filter(["cpp_integration"])
        for test in cpp_tests:
            self.output.info("==== Compiling %s" % test)
            self.folders.build = os.path.join(out_dir, test)
            cmake = CMake(self)
            cmake.configure(build_script_folder=os.path.join(src_path, test))
            cmake.build(build_tool_args=["-j1"] if is_ci() else [])

        # clean up
        self.folders.build = ""

        self.output.highlight("=== Built compiler tests in %s s" % str(round(time.time() - t)))

        # run tests

        # hack: concatenate CTestTestfile.cmake from each test into a single file
        # to have a nice report output
        ctestfile_common = os.path.join(out_dir, "CTestTestfile.cmake")
        ctests_list = Path(out_dir).rglob("CTestTestfile.cmake")
        with open(ctestfile_common, "a") as common:
            for file in ctests_list:
                content = load(self, file)
                common.write(content)

        if self.settings.os != "Android":
        # --test-dir option is only available since cmake 3.20
        # so we have to change current dir to be able to find tests
            prev_dir = os.getcwd()
            os.chdir(out_dir)
            self.run("ctest --output-on-failure")
            os.chdir(prev_dir)

    def build(self):
        if self.settings.target_abi is None:
            self.output.error(
                "Target ABI is not specified. Please provide settings.target_abi value")
        else:
            self.output.info("Target ABI is %s" % self.settings.target_abi)

        os.environ["NODE_PATH"] = self.deps_user_info["tsnative-std"].NODE_PATH

        if self.options.run_mode == "runtime" or self.options.run_mode == "all":
            self.output.info("======== RUNTIME TESTS ========")
            self.buildRuntimeTests()

        if self.options.run_mode == "declarator" or self.options.run_mode == "all":
            self.output.info("======== DECLARATOR TESTS ========")
            self.buildDeclaratorTests()

        if self.options.run_mode == "compile" or self.options.run_mode == "all":
            self.output.info("======== COMPILED TESTS ========")
            self.buildCompiledTests()

    def package(self):
        pass
        if self.options.run_mode == "all":
            ctestfile = load(self, "compiler_tests/CTestTestfile.cmake")
            raw_lines = [l for l in ctestfile.splitlines() if "add_test(" in l]
            pkg_bin_dir = os.path.join(self.folders.base_package, "bin")
            ctestfile_out = ""
            os.makedirs(pkg_bin_dir)
            for l in raw_lines:
                tokens = l.split("\"")
                self.output.info("Install test file: %s" % tokens[1])
                shutil.copy2(tokens[1], pkg_bin_dir)
                ctestfile_out += "add_test(%s \"%s\")%s" % (os.path.basename(
                    tokens[1]), os.path.join("bin", os.path.basename(tokens[1])), os.linesep)

            save(self, os.path.join(self.folders.base_package,
                 "CTestTestfile.cmake"), ctestfile_out)
        else:
            self.output.warn(
                "Files packed only when run_mode=all, but current mode is %s" % self.options.run_mode)

    def package_id(self):
        del self.info.options.run_mode
        del self.info.options.test_filter
        del self.info.options.verbose
        del self.info.options.opt_level
        del self.info.options.trace_import
        del self.info.options.print_ir
        del self.info.options.profile_build

    def setup_npm(self):
        self.init_npm_env()
        self.run('npm install')

    # TODO: common python lib required - use python_requires?
    # keep in sync with compiler/conanfile.py
    def init_npm_env(self):
        if is_ci():
            self.output.info("== CI mode detected. Applying patches...")
            if not "WORKSPACE" in os.environ:
                self.output.error("CI=true but missing WORKSPACE variable")

            self.output.info("== patch: NPM_CONFIG_CACHE=$\{WORKSPACE\}")
            os.environ["NPM_CONFIG_CACHE"] = os.environ["WORKSPACE"] + "/.npm"

            # hack for docker containers with root user
            if self.settings.os == "Linux":
                os.environ["HOME"] = os.environ["WORKSPACE"]
                self.run('npm install -g npm@6')
                self.run('npm config set unsafe-perm true')

            # hack for docker containers with root user
            if self.settings.os == "Linux":
                self.output.info("== patch: HOME=$\{WORKSPACE\}")
                os.environ["HOME"] = os.environ["WORKSPACE"]
                self.output.info("== patch: unsafe-perm=true")
                self.run('npm config set unsafe-perm true')
                self.output.info("== patch: install npm@6")
                self.run('npm install -g npm@6')

def is_ci():
    return "CI" in os.environ and os.environ["CI"].lower() == "true"


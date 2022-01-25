// Used Jenkins shared library
@Library('shared-lib@master') _
// imported need class from Jenkins shared library
import com.ncloudtech.emb.devops.pipeline.commonUtils
import com.ncloudtech.emb.devops.pipeline.gitUtils
import com.ncloudtech.emb.devops.pipeline.sshUtils
import com.ncloudtech.emb.devops.pipeline.npmUtils
import com.ncloudtech.emb.devops.pipeline.complexUtils
import com.ncloudtech.emb.devops.pipeline.notificationUtils

// initiate object for work
def commonUtils = new commonUtils()
def gitUtils = new gitUtils()
def sshUtils = new sshUtils()
def npmUtils = new npmUtils()
def complexUtils = new complexUtils()


// Vars for control skip build in CI
SKIP_CI = false

// Vars for fix auto increment version
INCREMENT_VERSION = false

pipeline {
    agent none

    parameters {
        booleanParam(name: 'PublishWithoutIncrement', defaultValue: false, description: 'Whether we need to publish artifact to npm registry (without version increment')
        string(name: 'IMAGE_NAME_FOR_LINUX_BUILD', defaultValue: "${global.SHARED_LIB_ANTIQ_DOCKER_IMAGE_BUILD_CMAKE_TS_NAME}", description: 'Name container image for build on Linux')
        string(name: 'IMAGE_TAG_FOR_LINUX_BUILD', defaultValue: "${global.SHARED_LIB_ANTIQ_DOCKER_IMAGE_BUILD_CMAKE_TS_VERSION}", description: 'Tag container image for build on Linux')
    }

    stages {
        // WARNING! Need add message for commit Auto increment 'patch' version package with '[skip ci]'
        // this is a protection against recursive run tasks in Jenkins by 'push' in Gitea and webhook
        stage('Skip CI') {
            agent { label 'linux64'}

            steps{
                script {
                    // check abort build by [skip ci] or [ci skip] in latest commit message
                    SKIP_CI = gitUtils.skipCIinLastCommit(this)
                }
            }

            post {
                always {
                    cleanWs()
                }
            }
        }

        stage('Increment version on master') {
            when {
                allOf {
                    expression { (gitUtils.getSourceBranch(this) == 'master') }
                    not { expression { SKIP_CI } }
                }
                beforeAgent true
            }

            agent {
                docker {
                    // use official Node LTS image from local Harbor
                    image "${JENKINS_PROXY_DOCKER_HUB_DOCKER_REGISTRY_REPO}/library/node:lts"
                }
            }

            environment {
                // Change environment for LOCAL work with NodeJS in container for fix error ACCESS to files on Linux
                // оverride HOME to WORKSPACE
                HOME = "${WORKSPACE}"
                // override default cache directory (~/.npm)
                NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
                // Change work NodeJS with CI
                // https://www.jenkins.io/doc/tutorials/build-a-node-js-and-react-app-with-npm/#add-a-test-stage-to-your-pipeline
                CI = 'true'

                // override PATH
                // https://docs.npmjs.com/cli/v6/configuring-npm/folders#executables
                PATH = "${WORKSPACE}/node_modules/.bin:${env.PATH}"
            }

            steps {
                script {
                    // Auto increment 'patch' version package with commit to GIT
                    // WARNING! Need add message for commit with '[skip ci]'
                    // this is a protection against recursive run tasks in Jenkins by 'push' in Gitea and webhook
                    // set environment:
                    // env.CURRENT_NODE_JS_PROJECT_VERSION
                    // env.NEW_NODE_JS_PROJECT_VERSION
                    complexUtils.nodeJSautoIncrementPackagePathVersionWithCommitInGitHTTPwithSkipCIinBaseImageFromDockerHub(this, "${env.JENKINS_GIT_CREDENTIALS_HTTP}", 'jenkins', 'emb_alerts@collabio.team')

                    // fix work with auto increment version
                    INCREMENT_VERSION = true
                }
            }

            post {
                always {
                    cleanWs()
                }
            }
        }

        stage('Build and test') {
            when {
                not { expression { SKIP_CI } }
                beforeAgent true
            }

            parallel {
                // Linux
                stage('Linux x86_64') {
                    agent {
                        // future refactoring - using harbor.devos.club
                        docker {
                            image "${JENKINS_ANTIQ_DOCKER_REGISTRY_REPO}/${params.IMAGE_NAME_FOR_LINUX_BUILD}:${params.IMAGE_TAG_FOR_LINUX_BUILD}"
                            registryUrl "${JENKINS_DOCKER_REGISTRY_URL}"
                            registryCredentialsId "${JENKINS_DOCKER_REGISTRY_CI_AUTHENTICATION_TOKEN}"
                            args "--user root"
                            alwaysPull true
                        }
                    }

                    environment {
                        // Change environment for LOCAL work with NodeJS in container for fix error ACCESS to files on Linux
                        // оverride HOME to WORKSPACE
                        HOME = "${WORKSPACE}"
                        // override default cache directory (~/.npm)
                        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
                        // Change work NodeJS with CI
                        // https://www.jenkins.io/doc/tutorials/build-a-node-js-and-react-app-with-npm/#add-a-test-stage-to-your-pipeline
                        CI = 'true'

                        // override PATH
                        // https://docs.npmjs.com/cli/v6/configuring-npm/folders#executables
                        PATH = "${WORKSPACE}/node_modules/.bin:${env.PATH}"
                    }

                    // need for pull changes from remote repo for autoincrement version
                    stages {
                        stage("Checkout repo") {
                            when {
                                expression { INCREMENT_VERSION }
                            }

                            steps {
                                script {
                                    // Work with GIT - update repo
                                    gitUtils.fetchAllAndPullWithCredentialsHTTP(this, "${env.JENKINS_GIT_CREDENTIALS_HTTP}")
                                }
                            }
                        }

                        stage("Setup Env") {
                            steps {
                                script {
                                    // with authorization in GIT by SSH
                                    withCredentials(bindings: [sshUserPrivateKey(credentialsId: "${env.JENKINS_GIT_CREDENTIALS_SSH}", keyFileVariable: 'SSH_KEY')]) {
                                        echo "Using agent ${env.NODE_NAME} (${env.JENKINS_URL})"

                                        // SSH in Linux container
                                        // add user jenkins for UID and GID mapping to container
                                        // disable check key hosts global and add SSH key for users
                                        complexUtils.initSSHforWorkWithGITinLinuxContainerArgsUserROOT(this, SSH_KEY, 'id_rsa')

                                        // clear NPM config user and in clone repo for local build
                                        npmUtils.deleteNpmrcLocalAndUser(this)

                                        // enable unsafe-perm since running as a root for install npm-prebuilt-dependencies
                                        // work from root for all script execute
                                        npmUtils.npmConfigSet(this, 'unsafe-perm true')

                                        // stick to version 6 since 7 one is flawed a lot with check version
                                        npmUtils.npmInstall(this, '-g npm@6')

                                        // 'npm install' with clean cache before and authorization in private repo in Nexus
                                        complexUtils.nodeJSnpmInstallWithCacheCleanAndAuthToPrivateRepo(this, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_ALL_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_STR, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)

                                        // delete SSH configs in Linux container
                                        complexUtils.clearSSHclientConfigInLinuxContainerArgsUserROOT(this)
                                    }
                                }
                            }
                        }

                        stage("Build") {
                            steps {
                                script {
                                    npmUtils.npmRun(this, 'lint')
                                    npmUtils.npmRun(this, 'build')
                                }
                            }
                        }

                        stage("Tests") {
                            steps {
                                script {
                                    // FIXME: enable parallel build once KDM-836 is fixed
                                    npmUtils.npmRun(this, 'test')
                                    npmUtils.npmRun(this, 'runtime_test')
                                }
                            }
                        }

                        stage("Publish")
                        {
                            when {
                                expression { params.PublishWithoutIncrement || (gitUtils.getSourceBranch(this) == 'master') }
                            }
                            steps {
                                script {
                                    // Custom 'npm run publishToLocalRegistry' with authorization in private repo to publishing artefact in Nexus and view version package
                                    complexUtils.antiqNodeJSnpmPublishToLocalRegistryWithAuthToPrivateRepo(this, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_PUBLIC_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_STR, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
                                }
                            }
                        }
                    }

                    post {
                        cleanup {
                            script {
                                // delete SSH configs in Linux container and custom clean workdir by conflict permissions to cleanWs()
                                complexUtils.clearSSHclientConfigAndClearWorkDirForFixErrorInPermissionsInLinuxContainerArgsUserROOT(this)
                            }
                        }

                        always {
                            script {
                                // disable unsafe-perm since running as a root for install npm-prebuilt-dependencies
                                npmUtils.npmConfigDelete(this, 'unsafe-perm true')

                                // always npm logout
                                // for clear configure NodeJS in case then do not delete .npmrc from one level
                                // this needing for clear work environment in future builds
                                npmUtils.logoutFromPrivateRegistryAndPrivateRegistryForPublish(this, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_ALL_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_PUBLIC_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_STR, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
                            }
                            // always clean work dir
                            cleanWs()
                        }
                    }
                }

                // Windows
                stage('Windows x86_64') {
                    agent {
                        label 'winsrv19'
                    }

                    environment {
                        // Change environment for LOCAL work with NodeJS on Windows
                        // override default cache directory (~/.npm)
                        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
                        // Change work NodeJS with CI
                        // https://www.jenkins.io/doc/tutorials/build-a-node-js-and-react-app-with-npm/#add-a-test-stage-to-your-pipeline
                        CI = 'true'

                        // override PATH with force using GIT from MSYS
                        // https://docs.npmjs.com/cli/v6/configuring-npm/folders#executables
                        PATH = "${WORKSPACE}/node_modules/.bin:/usr/bin:${env.PATH}"
                    }

                    stages {
                        stage("Fix CRLF on Windows") {
                            steps {
                                script {
                                    // on Windows in GIT config use core.autocrlf = true
                                    // when checkout repository on Windows all files change end line from LF to CRLF
                                    // this view how non-add files to GIT on local copy
                                    // need delete this changes
                                    gitUtils.fixCRLFonWindowsByRestore(this)
                                }
                            }
                        }

                        // need for pull changes from remote repo for autoincrement version
                        stage("Checkout repo") {
                            when {
                                expression { INCREMENT_VERSION }
                            }

                            steps {
                                script {
                                    // Work with GIT - update repo
                                    gitUtils.fetchAllAndPullWithCredentialsHTTP(this, "${env.JENKINS_GIT_CREDENTIALS_HTTP}")
                                }
                            }
                        }

                        stage("Setup Env") {
                            steps {
                                script {
                                    // with authorization in GIT by SSH
                                    withCredentials(bindings: [sshUserPrivateKey(credentialsId: "${env.JENKINS_GIT_CREDENTIALS_SSH}", keyFileVariable: 'SSH_KEY')]) {
                                        echo "Using agent ${env.NODE_NAME} (${env.JENKINS_URL})"

                                        // SSH on Windows in MSYS2
                                        // disable check key hosts and add SSH key for current user
                                        complexUtils.initSSHforWorkWithGITforCurrentUserOnWindows(this, 'SSH_KEY', 'id_rsa')

                                        // clear NPM config user and in clone repo for local build
                                        npmUtils.deleteNpmrcLocalAndUser(this)

                                        // hack: explicitly set python path on windows
                                        npmUtils.npmConfigSet(this, 'python \"C:\\Python39\\python\"')

                                        // stick to version 6 since 7 one is flawed a lot with check version
                                        npmUtils.npmInstall(this, '-g npm@6')

                                        // 'npm install' with clean cache before and authorization in private repo in Nexus
                                        complexUtils.nodeJSnpmInstallWithCacheCleanAndAuthToPrivateRepo(this, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_ALL_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_STR, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)

                                        // delete SSH configs on Windows in MSYS2
                                        sshUtils.deleteSshDirForUser(this)
                                    }
                                }
                            }
                        }

                        stage("Build") {
                            steps {
                                script {
                                    npmUtils.npmRun(this, 'lint')
                                    npmUtils.npmRun(this, 'build')
                                }
                            }
                        }

                        stage("Tests") {
                            steps {
                                script {
                                    // FIXME: enable parallel build once KDM-836 (???) is fixed
                                    npmUtils.npmRun(this, 'test')
                                    npmUtils.npmRun(this, 'runtime_test')
                                }
                            }
                        }

                        stage("Publish") {
                            when {
                                expression { params.PublishWithoutIncrement || (gitUtils.getSourceBranch(this) == 'master') }
                            }
                            steps {
                                script {
                                    // Custom 'npm run publishToLocalRegistry' with authorization in private repo to publishing artefact in Nexus and view version package
                                    complexUtils.antiqNodeJSnpmPublishToLocalRegistryWithAuthToPrivateRepo(this, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_PUBLIC_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_STR, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
                                }
                            }
                        }
                    }

                    post {
                        cleanup {
                            script {
                                // delete SSH configs on Windows
                                sshUtils.deleteSshDirForUser(this)
                            }
                        }

                        always {
                            script {
                                // always logout
                                // for clear configure NodeJS in case then do not delete .npmrc from one level
                                // this needing for clear work environment in future builds
                                npmUtils.logoutFromPrivateRegistryAndPrivateRegistryForPublish(this, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_ALL_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_PUBLIC_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_STR, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
                            }
                            // always clean work dir
                            cleanWs()
                        }
                    }
                }

                // MacOS arm64
                stage('MacOS arm64') {
                    agent {
                        label 'antiq_mac_arm64'
                    }

                    environment {
                        // Change environment for LOCAL work with NodeJS in container for fix error ACCESS to files on Linux
                        // override default cache directory (~/.npm)
                        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
                        // Change work NodeJS with CI
                        // https://www.jenkins.io/doc/tutorials/build-a-node-js-and-react-app-with-npm/#add-a-test-stage-to-your-pipeline
                        CI = 'true'

                        // override PATH
                        // https://docs.npmjs.com/cli/v6/configuring-npm/folders#executables
                        PATH = "${WORKSPACE}/node_modules/.bin:${env.PATH}"

                        // LLVM use
                        LLVM_DIR='/opt/local/libexec/llvm-11'
                    }

                    // need for pull changes from remote repo for autoincrement version
                    stages {
                        stage("Checkout repo") {
                            when {
                                expression { INCREMENT_VERSION }
                            }

                            steps {
                                script {
                                    // Work with GIT - update repo
                                    gitUtils.fetchAllAndPullWithCredentialsHTTP(this, "${env.JENKINS_GIT_CREDENTIALS_HTTP}")
                                }
                            }
                        }

                        stage("Setup Env") {
                            steps {
                                script {
                                    // with authorization in GIT by SSH
                                    withCredentials(bindings: [sshUserPrivateKey(credentialsId: "${env.JENKINS_GIT_CREDENTIALS_SSH}", keyFileVariable: 'SSH_KEY')]) {
                                        echo "Using agent ${env.NODE_NAME} (${env.JENKINS_URL})"

                                        // SSH on Linux or MacOS
                                        // disable check key hosts and add SSH key for current user
                                        complexUtils.initSSHforWorkWithGITforCurrentUSer(this, SSH_KEY, 'id_rsa')

                                        // clear NPM config user and in clone repo for local build
                                        npmUtils.deleteNpmrcLocalAndUser(this)

                                        // 'npm install' with clean cache before and authorization in private repo in Nexus
                                        complexUtils.nodeJSnpmInstallWithCacheCleanAndAuthToPrivateRepo(this, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_ALL_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_STR, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)

                                        // delete SSH configs on Linux or MacOS
                                        sshUtils.deleteSshDirForUser(this)
                                    }
                                }
                            }
                        }

                        stage("Build") {
                            steps {
                                script {
                                    npmUtils.npmRun(this, 'lint')
                                    npmUtils.npmRun(this, 'build')
                                }
                            }
                        }

                        stage("Tests") {
                            steps {
                                script {
                                    // FIXME: enable parallel build once KDM-836 is fixed
                                    npmUtils.npmRun(this, 'test')
                                    npmUtils.npmRun(this, 'runtime_test')
                                }
                            }
                        }

                        stage("Publish")
                                {
                                    when {
                                        expression { params.PublishWithoutIncrement || (gitUtils.getSourceBranch(this) == 'master') }
                                    }
                                    steps {
                                        script {
                                            // Custom 'npm run publishToLocalRegistry' with authorization in private repo to publishing artefact in Nexus and view version package
                                            complexUtils.antiqNodeJSnpmPublishToLocalRegistryWithAuthToPrivateRepo(this, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_PUBLIC_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_STR, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
                                        }
                                    }
                                }
                    }

                    post {
                        cleanup {
                            script {
                                // delete SSH configs on Linux or MacOS
                                sshUtils.deleteSshDirForUser(this)
                            }
                        }

                        always {
                            script {
                                // always npm logout
                                // for clear configure NodeJS in case then do not delete .npmrc from one level
                                // this needing for clear work environment in future builds
                                npmUtils.logoutFromPrivateRegistryAndPrivateRegistryForPublish(this, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_ALL_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_PUBLIC_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_STR, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
                            }
                            // always clean work dir
                            cleanWs()
                        }
                    }
                }

                // MacOS x86_64
                stage('MacOS x86_64') {
                    agent {
                        label 'antiq_mac_x86_64'
                    }

                    environment {
                        // Change environment for LOCAL work with NodeJS in container for fix error ACCESS to files on Linux
                        // override default cache directory (~/.npm)
                        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
                        // Change work NodeJS with CI
                        // https://www.jenkins.io/doc/tutorials/build-a-node-js-and-react-app-with-npm/#add-a-test-stage-to-your-pipeline
                        CI = 'true'

                        // override PATH
                        // https://docs.npmjs.com/cli/v6/configuring-npm/folders#executables
                        PATH = "${WORKSPACE}/node_modules/.bin:${env.PATH}"

                        // LLVM use
                        LLVM_DIR='/opt/local/libexec/llvm-11'
                    }

                    // need for pull changes from remote repo for autoincrement version
                    stages {
                        stage("Checkout repo") {
                            when {
                                expression { INCREMENT_VERSION }
                            }

                            steps {
                                script {
                                    // Work with GIT - update repo
                                    gitUtils.fetchAllAndPullWithCredentialsHTTP(this, "${env.JENKINS_GIT_CREDENTIALS_HTTP}")
                                }
                            }
                        }

                        stage("Setup Env") {
                            steps {
                                script {
                                    // with authorization in GIT by SSH
                                    withCredentials(bindings: [sshUserPrivateKey(credentialsId: "${env.JENKINS_GIT_CREDENTIALS_SSH}", keyFileVariable: 'SSH_KEY')]) {
                                        echo "Using agent ${env.NODE_NAME} (${env.JENKINS_URL})"

                                        // SSH on Linux or MacOS
                                        // disable check key hosts and add SSH key for current user
                                        complexUtils.initSSHforWorkWithGITforCurrentUSer(this, SSH_KEY, 'id_rsa')

                                        // clear NPM config user and in clone repo for local build
                                        npmUtils.deleteNpmrcLocalAndUser(this)

                                        // 'npm install' with clean cache before and authorization in private repo in Nexus
                                        complexUtils.nodeJSnpmInstallWithCacheCleanAndAuthToPrivateRepo(this, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_ALL_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_STR, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)

                                        // delete SSH configs on Linux or MacOS
                                        sshUtils.deleteSshDirForUser(this)
                                    }
                                }
                            }
                        }

                        stage("Build") {
                            steps {
                                script {
                                    npmUtils.npmRun(this, 'lint')
                                    npmUtils.npmRun(this, 'build')
                                }
                            }
                        }

                        stage("Tests") {
                            steps {
                                script {
                                    // FIXME: enable parallel build once KDM-836 is fixed
                                    npmUtils.npmRun(this, 'test')
                                    npmUtils.npmRun(this, 'runtime_test')
                                }
                            }
                        }

                        stage("Publish")
                                {
                                    when {
                                        expression { params.PublishWithoutIncrement || (gitUtils.getSourceBranch(this) == 'master') }
                                    }
                                    steps {
                                        script {
                                            // Custom 'npm run publishToLocalRegistry' with authorization in private repo to publishing artefact in Nexus and view version package
                                            complexUtils.antiqNodeJSnpmPublishToLocalRegistryWithAuthToPrivateRepo(this, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_PUBLIC_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_STR, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
                                        }
                                    }
                                }
                    }

                    post {
                        cleanup {
                            script {
                                // delete SSH configs on Linux or MacOS
                                sshUtils.deleteSshDirForUser(this)
                            }
                        }

                        always {
                            script {
                                // always npm logout
                                // for clear configure NodeJS in case then do not delete .npmrc from one level
                                // this needing for clear work environment in future builds
                                npmUtils.logoutFromPrivateRegistryAndPrivateRegistryForPublish(this, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_ALL_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_PUBLIC_URL, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_STR, global.SHARED_LIB_ANTIQ_NPM_PRIVATE_REPO_AUTH_TOKEN_CREDENTIALS_ID)
                            }
                            // always clean work dir
                            cleanWs()
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                // skip build on CI
                // ABORTED task and description of this
                commonUtils.postSkipCiFixStatus(this, SKIP_CI)

                // notification by email
                def notificationUtils = new notificationUtils()
                notificationUtils.stdEmailExt(this)
                notificationUtils = null
            }
        }
    }
}

// destroy object
commonUtils = null
gitUtils = null
sshUtils = null
npmUtils = null
complexUtils = null

// Used Jenkins shared library
@Library('shared-lib@master') _

// imported need class from Jenkins shared library
import com.ncloudtech.emb.devops.pipeline.gitUtils
import com.ncloudtech.emb.devops.pipeline.complexUtils
import com.ncloudtech.emb.devops.pipeline.JobUtils
import com.ncloudtech.emb.devops.pipeline.notificationUtils
import com.ncloudtech.emb.devops.pipeline.VersioningUtils
import com.ncloudtech.git.Gitea
import com.ncloudtech.atlassian.Jira

def gitUtils = new gitUtils()

def versioning = new VersioningUtils(this)
def version
def publish_tag = false

def user = "_"
def channel = "_"

def branch = gitUtils.getSourceBranch(this)
if (branch != "master") {
    user = "ci"
    channel = branch.replaceAll("/",'_')
}

String owner = 'antiq'
String projectName = 'tsnative'

pipeline {
    agent none
    parameters {
        string(name: 'CONAN_DEPLOY_REPO', defaultValue: 'antiq/conan_deploy', description: '')
        string(name: 'CONAN_DEPLOY_BRANCH', defaultValue: 'master', description: '')
    }

    options {
        timeout(time: 1, unit: 'HOURS')   // timeout on whole pipeline job
    }

    stages {
        stage('Check Previous Builds') {
            steps {
                script {
                    JobUtils.cancelPreviousPRBuilds(env.JOB_NAME, env.BUILD_NUMBER.toInteger(), currentBuild)
                }
            }
        }

        stage('Check formatting') {
            agent {
                docker {
                    image "${JENKINS_ANTIQ_DOCKER_REGISTRY_REPO}/clang-format:14-ubuntu20"
                    registryUrl "${JENKINS_DOCKER_REGISTRY_URL}"
                    registryCredentialsId "${JENKINS_DOCKER_REGISTRY_CI_AUTHENTICATION_TOKEN}"
                    reuseNode true
                }
            }

            steps {
                script {
                    echo "Using agent ${env.NODE_NAME} (${env.JENKINS_URL})"

                    if (complexUtils.clangFormatCheckForChangesSourceFilesForDiffBetweenTwoBranchesInGitRepository(
                            this, 'remotes/origin/master', 'remotes/origin/' + gitUtils.getSourceBranch(this)) == false) {
                        // fix bad formatting
                        error('Bad formatting source code!')
                    }
                }
            }

            post {
                always {
                    cleanWs()
                }
            }
        }

        stage("Build packages") {
            agent {
                docker {
                    image "${JENKINS_ANTIQ_DOCKER_REGISTRY_REPO}/tiny-tools:alpine-3.15"
                    registryUrl "${JENKINS_DOCKER_REGISTRY_URL}"
                    registryCredentialsId "${JENKINS_DOCKER_REGISTRY_CI_AUTHENTICATION_TOKEN}"
                }
            }
            options {
                skipDefaultCheckout true
            }

            stages {
                stage("Detect version") {
                    steps {
                        script {
                            version = versioning.detectVersion(branch)
                            publish_tag = versioning.isPublishingRequired()
                            if (!version) {
                                error "Failed to detect version: ${version}"
                            }
                        }
                    }
                }

                stage("Build compiler") {
                    steps {
                        script {
                            echo "Build compiler"
                            build job: "${params.CONAN_DEPLOY_REPO}/${params.CONAN_DEPLOY_BRANCH}", parameters: [
                                    string(name: 'PKG_REPO', value: projectName),
                                    string(name: 'PKG_BRANCH_OR_TAG', value: branch),
                                    string(name: 'PKG_CONAN_NAME', value: "tsnative-compiler"),
                                    string(name: 'PKG_CONANFILE_PATH', value: "compiler"),
                                    string(name: 'PKG_CONAN_VERSION', value: version),
                                    string(name: 'PKG_CONAN_USER', value: user),
                                    string(name: 'PKG_CONAN_CHANNEL', value: channel),
                                    string(name: 'PKG_HOST_PROFILE_REGEXP', value: 'linux.*|darwin.*|.*msvc.*'),
                                    booleanParam(name: 'PKG_IS_BUILD_TOOL', value: true)
                            ]
                        }
                    }
                }

                stage("Build declarator") {
                    steps {
                        script {
                            echo "Build declarator"
                            build job: "${params.CONAN_DEPLOY_REPO}/${params.CONAN_DEPLOY_BRANCH}", parameters: [
                                    string(name: 'PKG_REPO', value: projectName),
                                    string(name: 'PKG_BRANCH_OR_TAG', value: branch),
                                    string(name: 'PKG_CONAN_NAME', value: "tsnative-declarator"),
                                    string(name: 'PKG_CONANFILE_PATH', value: "declarator"),
                                    string(name: 'PKG_CONAN_VERSION', value: version),
                                    string(name: 'PKG_CONAN_USER', value: user),
                                    string(name: 'PKG_CONAN_CHANNEL', value: channel),
                                    string(name: 'PKG_HOST_PROFILE_REGEXP', value: 'linux.*|darwin.*|.*msvc.*'),
                                    booleanParam(name: 'PKG_IS_BUILD_TOOL', value: true)
                            ]
                        }
                    }
                }

                stage("Build std") {
                    steps {
                        script {
                            echo "Build std"
                            build job: "${params.CONAN_DEPLOY_REPO}/${params.CONAN_DEPLOY_BRANCH}", parameters: [
                                    string(name: 'PKG_REPO', value: projectName),
                                    string(name: 'PKG_BRANCH_OR_TAG', value: branch),
                                    string(name: 'PKG_CONAN_NAME', value: "tsnative-std"),
                                    string(name: 'PKG_CONANFILE_PATH', value: "std"),
                                    string(name: 'PKG_CONAN_VERSION', value: version),
                                    string(name: 'PKG_CONAN_USER', value: user),
                                    string(name: 'PKG_CONAN_CHANNEL', value: channel),
                                    string(name: 'PKG_CONAN_OPTIONS', value: "-o build_tests=True"),
                                    string(name: 'PKG_HOST_PROFILE_REGEXP', value: 'linux.*|darwin.*|.*mingw.*|android.*'),
                                    booleanParam(name: 'PKG_IS_BUILD_TOOL', value: false)
                            ]
                        }
                    }
                }

                stage("Tests") {
                    steps {
                        script {
                            echo "Build tests"
                            build job: "${params.CONAN_DEPLOY_REPO}/${params.CONAN_DEPLOY_BRANCH}", parameters: [
                                    string(name: 'PKG_REPO', value: projectName),
                                    string(name: 'PKG_BRANCH_OR_TAG', value: branch),
                                    string(name: 'PKG_CONAN_NAME', value: "tsnative-tests"),
                                    string(name: 'PKG_CONANFILE_PATH', value: "test"),
                                    string(name: 'PKG_CONAN_VERSION', value: version),
                                    string(name: 'PKG_CONAN_USER', value: user),
                                    string(name: 'PKG_CONAN_CHANNEL', value: channel),
                                    string(name: 'PKG_CONAN_UPLOAD_PATTERN', value: ''),
                                    string(name: 'PKG_HOST_PROFILE_REGEXP', value: 'linux.*|darwin.*|.*mingw.*|android.*'),
                                    booleanParam(name: 'PKG_IS_BUILD_TOOL', value: false)
                            ]
                        }
                    }
                }

                stage("Publish version tag") {
                    when {
                        expression { branch == "master" && publish_tag }
                    }
                    steps {
                        script {
                            versioning.publishVersionTag()

                            Gitea.createRelease(
                                    script: this,
                                    giteaHost: global.SHARED_LIB_GIT_REPOSITORY_HTTP_URL,
                                    creds: env.GIT_CREDENTIALS_HTTP,
                                    owner: owner,
                                    project: projectName,
                                    tagName: "v${version}",
                                    name: "release v${version}"
                            )

                            addFixVersionsToJira(
                                owner: owner,
                                projectName: projectName,
                                branch: 'master',
                                fieldValue: "v${version}"
                            )
                        }
                    }
                }
            }

            post {
                always {
                    cleanWs()
                }
            }
        }
    }

    post {
        always {
            script {
                // notification by email
                def notificationUtils = new notificationUtils()
                notificationUtils.stdEmailExt(this)
                notificationUtils = null
            }
        }
    }
}


gitUtils = null

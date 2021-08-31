gitea_creds = 'jenkins_gitea'

pipeline {
    agent none
    parameters {
        booleanParam(name: 'PublishWithoutIncrement', defaultValue: false, description: 'Whether we need to publish artifact to npm registry (without version increment')
    }
    stages {    
        stage('Build and test') {
            parallel {
                stage('Linux x86_64') {
                    agent {
                        docker {
                            image "docreg.devos.club/typescript-environment:1.3"
                            args "--user root"
                            registryUrl 'https://docreg.devos.club'
                            registryCredentialsId 'docker_kos'
                            alwaysPull true
                        }
                    }
                    environment {
                         // Override HOME to WORKSPACE
                         // ВНИМАНИЕ! опцию надо будет включить, когда переведём контейнер в пользовательское окружение!!
                         // пока не работает, поскольку всё внутри проекта создаётся из под пользователя jenkins
                         //HOME = "${WORKSPACE}"
                         // ВНИМАНИЕ! опцию надо будет включить, когда переведём контейнер в пользовательское окружение!!
                         // пока не работает, поскольку всё внутри проекта создаётся из под пользователя jenkins
                         // or override default cache directory (~/.npm)
                         //NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
                         // CI enable
                         CI = 'true'
                    }
                    stages {
                        stage("Build") {
                            steps {
                                script {
                                    withCredentials(bindings: [sshUserPrivateKey(credentialsId: gitea_creds, keyFileVariable: 'SSH_KEY')]) {
                                        useradd()
                                        ssh_config()
                                        ssh_user(SSH_KEY, "jenkins", "/home/jenkins")
                                        ssh_user(SSH_KEY, "root", "/root")

                                        // stick to version 6 since 7 one is flawed a lot
                                        sh "npm install -g npm@6"

                                        sh "npm -v"
                                        sh "node -v"

                                        npm_login_registry("https://nexus.devos.club/repository/antiq_npm", "nexus_npm_user_antiq_NpmToken")

                                        sh "DEBUG=1 npm install --unsafe-perm"
                                        sh "npm run build"
                                    }
                                }
                            }
                        }
                        stage("Run Linter") {
                            steps {
                                sh "npm run lint"
                            }
                        }
                        stage("Run Tests") {
                            steps {
                                // FIXME: KDM-836
                                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                                    sh "npm run test"
                                }
                            }
                        }
                        stage("Publish")
                        {
                            when {
                                expression { params.PublishWithoutIncrement }
                            }
                            steps {
                                // login to private registry
                                npm_login_registry_for_publish("https://nexus.devos.club/repository/antiq_npm_local", "nexus_npm_user_antiq_NpmToken")
                                // publish artifact
                                sh "npm run publishToLocalRegistry --registry=https://nexus.devos.club/repository/antiq_npm_local"
                            }
                        }
                    }
                    post {
                        always {
                            // always logout
                            npm_logout_registry("https://nexus.devos.club/repository/antiq_npm", "nexus_npm_user_antiq_NpmToken")
                            npm_logout_registry_for_publish("https://nexus.devos.club/repository/antiq_npm_local", "nexus_npm_user_antiq_NpmToken")
                            // always clean work dir
                            cleanWs()
                        }
                    }
                }
                stage('Windows x86_64') {
                    agent {
                        label 'winsrv19'
                    }
                    environment {
                         // Override HOME to WORKSPACE
                         HOME = "${WORKSPACE}"
                         // or override default cache directory (~/.npm)
                         NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
                         // CI enable
                         CI = 'true'
                    }
                    stages {
                        stage("Build") {
                            steps {
                                script {
                                    withCredentials(bindings: [sshUserPrivateKey(credentialsId: gitea_creds, keyFileVariable: 'SSH_KEY')]) {
                                        sh """
                                            mkdir -p \$HOME/.ssh
                                            cat \${SSH_KEY} > \$HOME/.ssh/id_rsa
                                            chmod 600 \$HOME/.ssh/id_rsa
                                            echo "Host *" > \$HOME/.ssh/config
                                            echo "    StrictHostKeyChecking no" >>  ~/.ssh/config
                                        """

                                        // stick to version 6 since 7 one is flawed a lot
                                        sh "npm install -g npm@6"

                                        sh "npm -v"
                                        sh "node -v"

                                        npm_login_registry("https://nexus.devos.club/repository/antiq_npm", "nexus_npm_user_antiq_NpmToken")

                                        // hack: explicitly set python path on windows
                                        sh "npm config set python \"C:\\Python39\\python\""
                                        sh "npm config list"

                                        // reorder paths so that npm uses msys' git instead one from windows
                                        sh "export PATH=/usr/bin:\$PATH && DEBUG=1 npm install"
                                        sh "npm run build"
                                    }
                                }
                            }
                        }
                        stage("Run Linter") {
                            steps {
                                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                                    sh "npm run lint"
                                }
                            }
                        }
                        stage("Run Tests") {
                            steps {
                                sh "npm test"
                            }
                        }
                        stage("Publish")
                        {
                            when {
                                expression { params.PublishWithoutIncrement }
                            }
                            steps {
                                // login to private registry
                                npm_login_registry_for_publish("https://nexus.devos.club/repository/antiq_npm_local", "nexus_npm_user_antiq_NpmToken")
                                // publish artifact
                                sh "npm run publishToLocalRegistry --registry=https://nexus.devos.club/repository/antiq_npm_local"
                            }
                        }
                    }
                    post {
                        always {
                            // always logout
                            npm_logout_registry("https://nexus.devos.club/repository/antiq_npm", "nexus_npm_user_antiq_NpmToken")
                            npm_logout_registry_for_publish("https://nexus.devos.club/repository/antiq_npm_local", "nexus_npm_user_antiq_NpmToken")
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
                emailext (
                    subject: "Pipeline status of ${currentBuild.fullDisplayName}: ${currentBuild.currentResult}",
                    body: "<p>Check console output at <a href='${env.BUILD_URL}display/redirect'>${env.JOB_NAME} [${env.BUILD_NUMBER}]</a></p>",
                    recipientProviders: [[$class: 'DevelopersRecipientProvider'], [$class: 'RequesterRecipientProvider']],
                    attachLog: true
                )
            }
        }
    }
}

void useradd()
{
    sh 'useradd -u $(stat -c "%u" .gitignore) jenkins'
}

void ssh_config()
{
    sh '''
        echo "Host *" >> /etc/ssh/ssh_config
        echo "    StrictHostKeyChecking no" >> /etc/ssh/ssh_config
        echo "    UserKnownHostsFile=/dev/null" >> /etc/ssh/ssh_config
    '''
}

void ssh_user(String ssh_key, String user_name, String home_dir)
{
    echo "Configure ssh"
    sh """
        mkdir -p ${home_dir}/.ssh
        cat ${ssh_key} > ${home_dir}/.ssh/id_rsa
        chmod 600 ${home_dir}/.ssh/id_rsa
        chown -R ${user_name} ${home_dir}
    """
}

// авторизуемся в репозитории для получения зависимостей
void npm_login_registry(String registry_url, String npm_auth_token_credentials_id)
{
   withCredentials(bindings: [string(credentialsId: "${npm_auth_token_credentials_id}", variable: 'authToken')]) {
        // https://www.jenkins.io/doc/book/pipeline/jenkinsfile/#string-interpolation
        // переопределяем переменные через переменные окружения, иначе не работает подстановка при настройке токена
        withEnv(["LOCAL_REGISTRY_URL=${registry_url}", "LOCAL_NPM_AUTH_TOKEN=${authToken}"]) {
             sh 'npm config set always-auth true'
             sh "npm config set registry ${registry_url}"
             sh 'npm config set $LOCAL_REGISTRY_URL:_authToken $LOCAL_NPM_AUTH_TOKEN'
             sh "npm config list"
        }
   }
}

void npm_logout_registry(String registry_url, String npm_auth_token_credentials_id)
{
   withCredentials(bindings: [string(credentialsId: "${npm_auth_token_credentials_id}", variable: 'authToken')]) {
        // https://www.jenkins.io/doc/book/pipeline/jenkinsfile/#string-interpolation
        // переопределяем переменные через переменные окружения, иначе не работает подстановка при настройке токена
        withEnv(["LOCAL_REGISTRY_URL=${registry_url}", "LOCAL_NPM_AUTH_TOKEN=${authToken}"]) {
             sh 'npm config delete $LOCAL_REGISTRY_URL:_authToken $LOCAL_NPM_AUTH_TOKEN'
             sh "npm config delete registry ${registry_url}"
             sh 'npm config delete always-auth true'
             sh "npm config list"
        }
   }
}

// авторизуемся в репозитории для публикации артефакта
void npm_login_registry_for_publish(String registry_url, String npm_auth_token_credentials_id)
{
   withCredentials(bindings: [string(credentialsId: "${npm_auth_token_credentials_id}", variable: 'authToken')]) {
        // https://www.jenkins.io/doc/book/pipeline/jenkinsfile/#string-interpolation
        // переопределяем переменные через переменные окружения, иначе не работает подстановка при настройке токена
        withEnv(["LOCAL_REGISTRY_URL=${registry_url}", "LOCAL_NPM_AUTH_TOKEN=${authToken}"]) {
             sh 'npm config set private true'
             sh 'npm config set always-auth true'
             sh "npm config set registry ${registry_url}"
             sh "npm config set publishConfig.registry ${registry_url}"
             sh 'npm config set $LOCAL_REGISTRY_URL:_authToken $LOCAL_NPM_AUTH_TOKEN'
             sh "npm config list"
        }
   }
}

void npm_logout_registry_for_publish(String registry_url, String npm_auth_token_credentials_id)
{
   withCredentials(bindings: [string(credentialsId: "${npm_auth_token_credentials_id}", variable: 'authToken')]) {
        // https://www.jenkins.io/doc/book/pipeline/jenkinsfile/#string-interpolation
        // переопределяем переменные через переменные окружения, иначе не работает подстановка при настройке токена
        withEnv(["LOCAL_REGISTRY_URL=${registry_url}", "LOCAL_NPM_AUTH_TOKEN=${authToken}"]) {
             sh 'npm config delete $LOCAL_REGISTRY_URL:_authToken $LOCAL_NPM_AUTH_TOKEN'
             sh "npm config delete publishConfig.registry ${registry_url}"
             sh "npm config delete registry ${registry_url}"
             sh 'npm config delete always-auth true'
             sh 'npm config delete private true'
             sh "npm config list"
        }
   }
}

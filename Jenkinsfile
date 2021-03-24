gitea_creds = 'jenkins_gitea'

pipeline {
    agent none
    stages {    
        stage('Build and test') {
            agent {
                docker {
                    image "docreg.devos.club/typescript-environment:1.1"
                    args "--user root"
                    registryUrl 'https://docreg.devos.club'
                    registryCredentialsId 'docker_kos'
                }
            }
            steps {
                script {
                    withCredentials(bindings: [sshUserPrivateKey(credentialsId: gitea_creds, keyFileVariable: 'SSH_KEY')]) {
                        useradd()
                        ssh_config()
                        ssh_user(SSH_KEY, "jenkins", "/home/jenkins")
                        ssh_user(SSH_KEY, "root", "/root")
                        sh "DEBUG=1 npm install"
                        sh "npm run lint"
                        sh "npm run build"
                        sh "npm test"
                    }
                }
            }
            post {
                cleanup {
                    sh 'rm -rf ./*'
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

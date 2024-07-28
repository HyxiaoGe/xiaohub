pipeline {
    agent any
    tools{
        git 'Server Git'
    }
    options {
        timestamps()
    }
    stages {
        stage('Checkout') {
            steps {
                script {
                    retry(3) {
                        timeout(time: 5, unit: 'MINUTES') {
                            git branch: 'master',
                                url: 'https://github.com/HyxiaoGe/xiaohub.git',
                                credentialsId: 'login_credentials'
                        }
                    }
                }
            }
        }
        stage('Prepare environment') {
            steps {
                script {
                    echo 'prepare necessary environment...'
                    writeFile file: '.env', text: """
                    VITE_APP_END_POINT=${env.END_POINT}
                    VITE_APP_WEBSOCKET_END_POINT=ws://${env.END_POINT}
                    VITE_APP_HTTP_END_POINT=http://${env.END_POINT}
                    """
                }
            }
        }
        stage('Install Dependencies') {
            steps {
                echo 'Installing NPM dependencies...'
                sh 'npm install'
            }
        }
        stage('Build') {
            steps {
                echo 'Building the application...'
                withEnv(['NODE_ENV=production']) {
                    sh 'npm run build'
                }
            }
        }
        stage('Deployment') {
            steps {
                echo 'Deploying to Nginx directory...'
                sh 'rm -rf /docker/nginx/data/html/xiaohub/*'
                sh 'cp -r dist/* /docker/nginx/data/html/xiaohub/'
                sh 'docker restart nginx'
                echo 'Deployment completed successfully.'
            }
        }
    }
    post {
        success {
            echo 'Build succeeded!'
        }
        failure {
            echo 'Build failed!'
            echo 'Checking for errors...'
            script {
                sh 'cat /var/log/jenkins/jenkins.log'
            }
        }
    }
}
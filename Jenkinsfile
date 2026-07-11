pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Source code downloaded from GitHub'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t student-attendance-app .'
            }
        }

        stage('Stop Old Container') {
            steps {
                bat 'docker stop attendance-container || exit 0'
                bat 'docker rm attendance-container || exit 0'
            }
        }

        stage('Run Docker Container') {
            steps {
                bat 'docker run -d -p 5000:5000 --name attendance-container student-attendance-app'
            }
        }
    }
}
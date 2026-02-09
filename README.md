<img width="101" height="28" alt="image" src="https://github.com/user-attachments/assets/16c2b083-fd3a-4151-bb32-ce39672448c7" />
<img width="101" height="28" alt="image" src="https://github.com/user-attachments/assets/55d9c748-c7b0-4836-b23c-03f7f02eec8a" />
<img width="111" height="28" alt="image" src="https://github.com/user-attachments/assets/c8f56e6a-a105-48c2-836c-b4ab9dc1dc19" />
<img width="98" height="28" alt="image" src="https://github.com/user-attachments/assets/22b125cb-f115-4feb-88b4-d2f2f316b413" />
<img width="134" height="28" alt="image" src="https://github.com/user-attachments/assets/871c55e3-7706-44a7-8e7b-b04a2c7d4277" />

## 📌 Overview

This project is a university assignment focused on detecting fake news using a modern microservices architecture. It leverages FastAPI for AI-powered text analysis, Node.js for the backend application logic, and MongoDB as the NoSQL database to store news articles and classification results.
The system analyzes input news content (e.g., headlines or full text) and predicts whether it is real or fake, supporting efforts to combat misinformation.

## 🏗️ Architecture

- AI/Machine Learning Microservice: Built with FastAPI (Python)
 - Hosts the trained model (or rule-based classifier)
 - Exposes REST endpoints for news verification
- Main Backend Service: Built with Node.js
 - Manages user requests, data flow, and integration
 - Communicates with the FastAPI microservice
- Database: MongoDB
 - Stores news entries, sources, prediction results, timestamps, and metadata



















```bash
mvn spring-boot:run
```

compile:
        cd api/ && ./mvnw clean compile

test:
    cd api/ && ./mvnw test

lint:
    cd client/ && npm run lint

build:
    cd client/ && npm run build

spring:
   cd api/ && ./mvnw clean spring-boot:run

dev:
   cd client/ && npm run dev
   
uv:
    cd ai-service/ && uv run uvicorn main:app --host 0.0.0.0 --port 8000 --reload

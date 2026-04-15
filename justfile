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


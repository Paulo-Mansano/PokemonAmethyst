# Build da API Spring Boot (Java 17 + Maven)
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn -B -DskipTests package

# Imagem final: só o JRE
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN groupadd --system spring && useradd --system --gid spring spring
USER spring:spring

COPY --from=build /app/target/pokemon-amethyst-*.jar /app/app.jar

EXPOSE 8080

# Render (e outros PaaS) definem PORT; localmente usa 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar -Dserver.port=${PORT:-8080} /app/app.jar"]

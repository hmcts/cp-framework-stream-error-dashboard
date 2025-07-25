# Stream Errors Dashboard

This project is a static dashboard for viewing stream errors, served via Docker and Nginx.

## Prerequisites
- Please follow the [Docker Desktop installation guide](https://tools.hmcts.net/confluence/display/EI/Development+environment+setup+using+Docker+Desktop)
- As mentioned in the above document, make sure that you login to ACR before running any docker commands, otherwise docker image will not be downloaded
    ```sh
        az login
        az acr login -n crmdvrepo01
    ```

## How to Run the Dashboard?
   ```sh
   docker run -e BACKEND_URL="http://host.docker.internal:8080/progression-service" -p 8081:80 crmdvrepo01.azurecr.io/hmcts/framework-stream-error-dashboard:latest
   ```
- The dashboard will be available at [http://localhost:8081](http://localhost:8081)
- If you do **not** supply `BACKEND_URL`, the container will fail to start and print an error `message.
- Some of the valid BACKEND_URL values are:
   - `https://steccm51.ingress01.dev.nl.cjscp.org.uk/progression-service`
   - `http://host.docker.internal:8080/progression-service` (when port forward to a service is enabled)
   - NOTE: `host.docker.internal` is the way to access host machine from within a docker container when using Docker Desktop. If you are on linux and using native docker command `localhost can be used instead
- You can spin up multiple containers pointing to different BACKEND_URL, however each container should run on different port, for example:
   - `docker run -e BACKEND_URL="http://host.docker.internal:8080/usersgroups-service" -p 8082:80 crmdvrepo01.azurecr.io/hmcts/framework-stream-error-dashboard:latest`
   - `docker run -e BACKEND_URL="http://host.docker.internal:8080/listing-service" -p 8083:80 crmdvrepo01.azurecr.io/hmcts/framework-stream-error-dashboard:latest`

## Development

### Build and Run with Docker Compose
1. Edit `docker-compose.yml` to set your desired `BACKEND_URL` (default is `http://host.docker.internal:8080/cakeshop-service`).
2. Build and start the app:
   ```sh
   docker compose up --build --remove-orphans
   ```
   NOTE: --build will always rebuild the image regardless if it's existence (recommended)
3. The dashboard will be available at [http://localhost:8081](http://localhost:8081)

### Using Wiremock for Backend Stubbing

1. Wiremock mappings and fixtures are under the `wiremock/` directory in this project:
   - `wiremock/mappings/` for stub mapping JSON files
   - `wiremock/__files/` for response files
2. Run:
   ```sh
   docker compose --profile wiremock up --build --remove-orphans
   ```
   This will:
   - Start Wiremock on port 9000
   - Set `BACKEND_URL` to `http://wiremock/stubbed-service` for the dashboard
   - Use mappings that match `/stubbed-service/...`

You can add or edit mappings in `wiremock/mappings/` and response files in `wiremock/__files/`.

### How to publish a new docker image?
- [azure-pipelines.yaml](azure-pipelines.yaml) uses ADO pipeline template that builds and pushes the image to Azure Container Registry (ACR)
- [cp-framework-stream-error-dashboard](https://dev.azure.com/hmcts-cpp/cpp-apps/_build?definitionId=481&_a=summary) ADO pipeline need to be triggered manually by specifying branch name as input
- Latest commit hash is used as image tag while publishing to ACR, `latest` tag also gets updated automatically
- Image name with latest tag: `crmdvrepo01.azurecr.io/hmcts/framework-stream-error-dashboard:latest`
- As ADO pipeline must be triggered manually, docker image is not going to be available for each git commit
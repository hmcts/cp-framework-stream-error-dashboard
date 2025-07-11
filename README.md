# Stream Errors Dashboard

This project is a static dashboard for viewing stream errors, served via Docker and Nginx.

## Prerequisites
- [Docker](https://www.docker.com/get-started) installed on your system
- [Docker Compose](https://docs.docker.com/compose/) (for compose usage)

## Build and Run with Docker Compose

1. Edit `docker-compose.yml` to set your desired `BACKEND_URL` (default is `http://host.docker.internal:8080/cakeshop-service`).
2. Build and start the app:
   ```sh
   docker compose up --build --remove-orphans
   ```
   --build will always rebuild the image regardless if it's existence
3. The dashboard will be available at [http://localhost:8081](http://localhost:8081)

## Build and Run with Docker Only

1. Build the Docker image:
   ```sh
   docker build -t stream-error-dashboard .
   ```
2. Run the Docker container (you **must** supply the `BACKEND_URL` environment variable):
   ```sh
   docker run -e BACKEND_URL="http://host.docker.internal:8080/cakeshop-service" -p 8081:80 \
     -v $(pwd)/index.html:/usr/share/nginx/html/index.html \
     -v $(pwd)/main.js:/usr/share/nginx/html/main.js \
     -v $(pwd)/filter.js:/usr/share/nginx/html/filter.js \
     -v $(pwd)/api.js:/usr/share/nginx/html/api.js \
     -v $(pwd)/ui.js:/usr/share/nginx/html/ui.js \
     -v $(pwd)/navigation.js:/usr/share/nginx/html/navigation.js \
     $(docker build -q -t stream-error-dashboard .)
   ```
   - The dashboard will be available at [http://localhost:8081](http://localhost:8081)
   - If you do **not** supply `BACKEND_URL`, the container will fail to start and print an error `message.

## Customizing BACKEND_URL

* You can point the dashboard to any backend by changing the `BACKEND_URL` value in either the compose file or the `docker run` command.
* Please note that when port forwarding is done, BACKEND_URL should point to host machine using reserved variable `host.docker.internal` and `localhost` will not work, i.e. `BACKEND_URL=http://host.docker.internal:8082/some-service` 


## Development

You can also run the dashboard locally by opening `index.html` in your browser, but AJAX calls may be blocked by CORS unless your backend allows it. 

## Using Wiremock for Backend Stubbing

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

NOTE: To run the dashboard against wiremock backend it can only be done through docker compose, if one want to use plain docker run command then wiremock has to be managed independently either as separate docker container or as a process on the host

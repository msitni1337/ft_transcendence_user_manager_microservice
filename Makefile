COMPOSE_FILE=./docker-compose.yml

detach=#-d

# BECAUSE THIS IS LINKED TO docker-compose.yml for the volumes path if you want to change it don't forget to change it in docker-compose.yml
VOL_USER=simo

all: create_volumes_dir set-host-and-permission
	docker compose -f ${COMPOSE_FILE} up ${detach}
build: create_volumes_dir set-host-and-permission
	docker compose -f ${COMPOSE_FILE} up --build ${detach}
clean:
	docker compose -f ${COMPOSE_FILE} down
re: clean all

#Create docker persistent volumes
create_volumes_dir:
	@mkdir -p /home/${VOL_USER}/docker_volumes/api_gateway_db_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/user_manager_db_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/friends_manager_db_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/static_data_volume
	@mkdir -p /home/${VOL_USER}/docker_volumes/rabbit_mq_log_volume
#Set host to fake route domains used to localhost
set-host-and-permission:
	@if ! grep -q "server.transcendence.fr" /etc/hosts; then \
		sudo sh -c 'echo "127.0.0.1	server.transcendence.fr" >> /etc/hosts'; \
	fi
	@if ! groups | grep -q docker; then\
		sudo usermod -aG docker ${USER};\
	fi
#View running services
ps:
	docker ps -a
FROM debian:bookworm

RUN apt update && apt upgrade -y

RUN apt install wget -y 

RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN wget https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh

RUN chmod u+x install.sh

RUN ./install.sh

RUN source "$HOME/.nvm/nvm.sh" && nvm install 22

RUN openssl req -x509 -newkey rsa:4096 -keyout /private.key -out /cert.pem -sha256 -days 3650 -noenc -subj "/C=MA/ST=BENGURIR/L=BENGURIR/SN=msitni"

RUN mkdir app

WORKDIR /app

COPY ./app/package.json .

RUN source "$HOME/.nvm/nvm.sh" && npm install

COPY ./app /app

EXPOSE 5566

ENTRYPOINT source "$HOME/.nvm/nvm.sh" && npm start

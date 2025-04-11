import { FastifyReply, FastifyRequest } from "fastify";
import { RabbitMQRequest, RabbitMQUserManagerOp, UpdateUser } from "../types/RabbitMQMessages";
import rabbitmq from "../classes/RabbitMQ";
import fs from "fs";
import { pipeline } from "stream/promises";
import { discoverDocument } from "../models/DiscoveryDocument";
import Busboy, { BusboyHeaders } from "@fastify/busboy";
import { multipart_fields, multipart_files } from "../types/multipart";
import db from "../classes/Databases";
import { UserModel } from "../types/DbTables";


// TODO: agregate data from different microservices
export const FetchUserInfo = async (request: FastifyRequest<{ Querystring: { uid: string } }>, reply: FastifyReply) => {
    try {
        reply.hijack();
        const { uid } = request.query;
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQUserManagerOp.FETCH,
            message: uid === 'me' ? request.jwt.sub : uid,
            id: '',
            JWT: request.jwt
        };
        rabbitmq.sendToUserManagerQueue(RabbitMQReq, (response) => {
            reply.raw.statusCode = response.status;
            if (response.status !== 200 || response.message === undefined)
                return reply.raw.end(response.message);
            var payload = JSON.parse(response.message);
            const query = db.persistent.prepare('SELECT username FROM users WHERE UID = ? ;');
            const res = query.get(request.jwt.sub) as UserModel;
            if (res)
                payload.username = res.username;
            reply.raw.end(reply.serialize(payload));
        });
    } catch (error) {
        console.log(`ERROR: FetchUserInfo(): ${error}`);
        reply.raw.statusCode = 500;
        reply.raw.end("ERROR: internal error, try again later.");
    }
    return Promise.resolve();
}

export const UpdateUserInfo = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.is_valid_multipart)
        return reply.code(400).send('bad request');
    try {
        const UpdatedInfo: UpdateUser = {
            bio: null,
            picture_url: null
        };
        const username: multipart_fields | undefined = request.fields.find((field: multipart_fields, i) => field.field_name === 'username');
        const bio: multipart_fields | undefined = request.fields.find((field: multipart_fields, i) => field.field_name === 'bio');
        const image: multipart_files | undefined = request.files_uploaded.find((file: multipart_files) => file.field_name === 'picture');
        if (image) {
            if (image.mime_type !== 'image/jpeg')
                return reply.code(400).send(`only image jpeg are allowed`);
            UpdatedInfo.picture_url = `/static/profile/${request.jwt.sub}.jpg`;
            fs.writeFileSync(UpdatedInfo.picture_url, image.field_file.read());
        }
        console.log('got: ' + request.fields.length);
        if (bio) {
            UpdatedInfo.bio = bio.field_value;
        }
        if (username === undefined && UpdatedInfo.bio === null && UpdatedInfo.picture_url === null)
            return reply.code(400).send('bad request no field is supplied');
        if (username && username.field_value.length < 3)
            return reply.code(400).send('bad request provide a valid username');
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQUserManagerOp.UPDATE,
            message: JSON.stringify(UpdatedInfo),
            id: '',
            JWT: request.jwt
        };
        reply.hijack();
        rabbitmq.sendToUserManagerQueue(RabbitMQReq, (response) => {
            reply.raw.statusCode = response.status;
            reply.raw.end(response.message);
        });
    } catch (error) {
        console.log(`ERROR: FetchUserInfo(): ${error}`);
        reply.raw.statusCode = 500;
        reply.raw.end("ERROR: internal error, try again later.");
    }
    return Promise.resolve();
}

export const RemoveUserProfile = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const UpdatedInfo: UpdateUser = {
            bio: null,
            picture_url: `/static/profile/default.jpg`
        };
        const picture_path = `/static/profile/${request.jwt.sub}.jpg`;
        if (fs.existsSync(picture_path))
            fs.unlinkSync(picture_path);
        else
            return reply.status(403).send('Picture already removed.');
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQUserManagerOp.UPDATE,
            message: JSON.stringify(UpdatedInfo),
            id: '',
            JWT: request.jwt
        };
        reply.hijack();
        rabbitmq.sendToUserManagerQueue(RabbitMQReq, (response) => {
            reply.raw.statusCode = response.status;
            reply.raw.end(response.message);
        });
    } catch (error) {
        console.log(`ERROR: RemoveUserProfile(): ${error}`);
        reply.raw.statusCode = 500;
        return reply.raw.end("ERROR: internal error, try again later.");
    }
}
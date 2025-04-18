import { JWT } from "./AuthProvider";

export enum RabbitMQUserManagerOp {
    CREATE_GOOGLE = 1,
    CREATE_STANDARD,
    UPDATE,
    DELETE,
    FETCH
}

export enum RabbitMQFriendsManagerOp {
    ADD_FRIEND = 1,
    ACCEPT_REQUEST,
    DENY_REQUEST,
    REMOVE_FRIEND,
    LIST_FRIENDS,
    LIST_REQUESTS,
}

export type UpdateUser = {
    picture_url: string | null,
    bio: string | null
};

export type RabbitMQRequest = {
    op: number,
    message?: string
    id: string
    JWT: JWT
};

export type RabbitMQResponse = {
    op: number,
    status: number,
    message?: string
    req_id: string
};

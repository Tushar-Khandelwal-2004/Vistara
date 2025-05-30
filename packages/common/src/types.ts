import {z} from "zod"

export const CreateUserSchema=z.object({
    username:z.string().min(3).max(50),
    password:z.string().min(4).max(50),
    name:z.string(),
})

export const SigninSchema=z.object({
    username:z.string().min(3).max(50),
    password:z.string().min(4).max(50),
})

export const CreateRoomSchema=z.object({
    name:z.string().min(3).max(20),
    
})
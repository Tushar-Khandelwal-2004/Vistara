import { z } from "zod"

// export const CreateUserSchema=z.object({
//     username:z.string().min(3).max(50),
//     password:z.string().min(4).max(50),
//     name:z.string(),
// })


export const CreateUserSchema = z.object({
    name: z.string()
        .min(2, { message: "Name must be at least 2 characters long" }),
    username: z.string()
        .email({ message: "Please enter a valid email address" }),
    password: z.string()
        .min(6, { message: "Password must be at least 6 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
});


export const SigninSchema = z.object({
    username: z.string()
        .email({ message: "Please enter a valid email address" }),
    password: z.string()
        .min(6, { message: "Password must be at least 6 characters long" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
})

export const CreateRoomSchema = z.object({
    name: z.string().min(3).max(20),

})
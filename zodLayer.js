import { z } from "zod";

export const loginUser = z.object({
    email: z.email().lowercase(),
    password: z.string().min(8).max(12),
});
export const signupUser = z.object({
    firstName: z.string().min(2).max(20),
    lastName: z.string().min(2).max(20),
    email: z.email().lowercase(),
    password: z.string().min(8).max(12),
});

export const noteSchema = z.object({
    note: z.string().trim().min(1, "Note cannot be empty").max(5000, "Note is too long"),
});

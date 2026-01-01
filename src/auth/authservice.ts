import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/user";
import { SignupInput, LoginInput } from "./auth.schema";

const SALT_ROUNDS = 10;

export interface AuthResponse {
    user: Omit<IUser, "password">;
    token: string;
}

function generateToken(user: IUser): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }
    return jwt.sign(
        { userId: user._id, role: user.role },
        secret,
        { expiresIn: "7d" }
    );
}

export async function signup(data: SignupInput): Promise<AuthResponse> {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
        throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await User.create({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role
    });

    const token = generateToken(user as IUser);
    const userObj = user.toObject();
    const { password, ...userWithoutPassword } = userObj;

    return {
        user: userWithoutPassword as Omit<IUser, "password">,
        token
    };
}

export async function login(data: LoginInput): Promise<AuthResponse> {
    const user = await User.findOne({ email: data.email });
    if (!user) {
        throw new Error("Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
        throw new Error("Invalid email or password");
    }

    const token = generateToken(user as IUser);
    const userObj = user.toObject();
    const { password, ...userWithoutPassword } = userObj;

    return {
        user: userWithoutPassword as Omit<IUser, "password">,
        token
    };
}

export async function me(userId: string): Promise<Omit<IUser, "password">> {
    const user = await User.findById(userId).select("-password");
    if (!user) {
        throw new Error("User not found");
    }
    return user.toObject() as Omit<IUser, "password">;
}


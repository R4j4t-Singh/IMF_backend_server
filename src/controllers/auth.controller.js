import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../utilities/asyncHandler.js";
import { ApiError } from "../utilities/ApiError.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const signUp = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (
    !email ||
    !password ||
    [email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Email and password are required");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email already exist");
  }

  const encryptedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: encryptedPassword,
    },
  });

  if (!user) {
    throw new ApiError("Something went wrong while creating user");
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        user,
      },
      "User created Successfully"
    )
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (
    !email ||
    !password ||
    [email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
    select: {
      id: true,
      email: true,
      password: true,
    },
  });

  if (!user) {
    throw new ApiError("404", "User does not exist");
  }

  const check = await bcrypt.compare(password, user.password);

  if (!check) {
    throw new ApiError("400", "Incorrect credentials");
  }

  const sessionToken = jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_TOKEN_EXPIRY }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("sessionToken", sessionToken, cookieOptions)
    .json(new ApiResponse(200, {}, "Logged In successfully"));
});

const logOut = asyncHandler(async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(202)
    .clearCookie("sessionToken", cookieOptions)
    .json(new ApiResponse(202, {}, "Logged out successfully"));
});

export { login, signUp, logOut };

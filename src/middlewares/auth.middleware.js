import { asyncHandler } from "../utilities/asyncHandler.js";
import { ApiError } from "../utilities/ApiError.js";
import jwt from "jsonwebtoken";

const auth = asyncHandler(async (req, res, next) => {
  const sessionToken = req.cookies?.sessionToken;

  if (!sessionToken) {
    throw new ApiError(401, "Unauthorised request");
  }

  const decodedToken = jwt.verify(sessionToken, process.env.JWT_SECRET_KEY);

  if (!decodedToken) {
    throw new ApiError(401, "Invalid access token");
  }

  req.userID = decodedToken.id;

  next();
});

export { auth };

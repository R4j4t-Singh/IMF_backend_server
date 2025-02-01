import { PrismaClient } from "@prisma/client";
import { asyncHandler } from "../utilities/asyncHandler.js";
import { ApiResponse } from "../utilities/ApiResponse.js";
import { ApiError } from "../utilities/ApiError.js";
import { codenames } from "../constants.js";

const prisma = new PrismaClient();
const allowedStatuses = [
  "Available",
  "Deployed",
  "Destroyed",
  "Decommissioned",
];
const _selfDestructCode = "DEST123"; //Hardcoded

const getGadgets = asyncHandler(async (req, res) => {
  let status = req.query?.status || "available";

  status = allowedStatuses.find(
    (allowedStatus) => allowedStatus.toLowerCase() === status.toLowerCase()
  );

  const gadgets = await prisma.gadget.findMany({
    where: {
      status: status,
    },
  });

  gadgets.forEach((gadget) => {
    const msp = Math.floor(Math.random() * 100) + 1;
    gadget.name = `${gadget.name}- ${msp}% success probability`;
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        gadgets,
      },
      "Gadgets fetched successfully"
    )
  );
});

const addGadget = asyncHandler(async (req, res) => {
  const random = Math.floor(Math.random() * 30) + 1;
  const name = `The ${codenames[random]}`;
  const creator = req.userID;

  if (!creator) {
    throw new ApiError(401, "Unauthorised request");
  }

  const gadget = await prisma.gadget.create({
    data: {
      name: name,
      userId: creator,
    },
  });

  if (!gadget) {
    throw new ApiError(500, "Something went wrong while adding gadget");
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        gadget,
      },
      "Gadget addded Successfully"
    )
  );
});

const allowedFields = ["name", "status"];

const updateGadget = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const data = req.body;

  if (!id) {
    throw new ApiError(400, "Gadget id is required");
  }

  const gadget = await prisma.gadget.findUnique({
    where: {
      id: id,
    },
  });

  if (!gadget) {
    throw new ApiError(404, "Gadget does not exist");
  }

  const validUpdates = Object.keys(data)
    .filter((key) => allowedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = data[key];
      return obj;
    }, {});

  if (Object.keys(validUpdates).length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "No fields for update"));
  }

  const updatedGadget = await prisma.gadget.update({
    where: {
      id: id,
    },
    data: validUpdates,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        gadget: updatedGadget,
      },
      "Data updated successfully"
    )
  );
});

const removeGadget = asyncHandler(async (req, res) => {
  const id = req.params.id;

  if (!id) {
    throw new ApiError(400, "Gadget id is required");
  }

  const gadget = await prisma.gadget.findUnique({
    where: {
      id: id,
    },
  });

  if (!gadget) {
    throw new ApiError(404, "Gadget does not exist");
  }

  await prisma.gadget.update({
    where: {
      id: id,
    },
    data: {
      status: "Decommissioned",
      decommissonedAt: new Date(),
    },
  });

  const updatedGadget = await prisma.gadget.findUnique({
    where: {
      id: id,
    },
    select: {
      status: true,
    },
  });

  if (updatedGadget.status != "Decommissioned") {
    throw new ApiError(500, "Something went wrong while deleting gadget");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Gadget deleted Successfully"));
});

const selfDestruct = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { code } = req.body;

  if (!id && !code) {
    throw new ApiError(400, "Gadget id and code is required");
  }

  const gadget = await prisma.gadget.findUnique({
    where: {
      id: id,
    },
  });

  if (!gadget) {
    throw new ApiError(404, "Gadget does not exist");
  }

  if (code != _selfDestructCode) {
    throw new ApiError(400, "WRONG code!!");
  }

  await prisma.gadget.update({
    where: {
      id: id,
    },
    data: {
      status: "Destroyed",
    },
  });

  const updatedGadget = await prisma.gadget.findUnique({
    where: {
      id: id,
    },
    select: {
      status: true,
    },
  });

  if (updatedGadget.status != "Destroyed") {
    throw new ApiError(500, "Something went wrong while destroying gadget");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Gadget destroyed Successfully"));
});

export { addGadget, getGadgets, removeGadget, selfDestruct, updateGadget };

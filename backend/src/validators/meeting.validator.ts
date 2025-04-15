// src/validators/meeting.validator.ts
import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const validateCreateMeeting = [
  body("agenda").notEmpty().withMessage("Agenda is required"),
  body("gtimName").notEmpty().withMessage("GTIM Name is required"),
  body("startDate").isISO8601().toDate().withMessage("Invalid start date"),
  body("endDate")
    .isISO8601()
    .toDate()
    .withMessage("Invalid end date")
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),
  body("startTime").notEmpty().withMessage("Start time is required"),
  body("endTime").notEmpty().withMessage("End time is required"),
  body("meetingRoomName")
    .notEmpty()
    .withMessage("Meeting room name is required"),
  body("departmentName").notEmpty().withMessage("Department name is required"),
  body("equipmentIds")
    .optional()
    .isArray()
    .withMessage("Equipment IDs must be an array"),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateUpdateMeeting = [
  body("agenda").optional().notEmpty().withMessage("Agenda is required"),
  body("gtimName").optional().notEmpty().withMessage("GTIM Name is required"),
  body("startDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid start date"),
  body("endDate")
    .optional()
    .isISO8601()
    .toDate()
    .withMessage("Invalid end date")
    .custom((endDate, { req }) => {
      if (
        req.body.startDate &&
        new Date(endDate) <= new Date(req.body.startDate)
      ) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),
  body("startTime").optional().notEmpty().withMessage("Start time is required"),
  body("endTime").optional().notEmpty().withMessage("End time is required"),
  body("meetingRoomId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Invalid meeting room ID"),
  body("departmentId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Invalid department ID"),
  body("equipmentIds")
    .optional()
    .isArray()
    .withMessage("Equipment IDs must be an array"), // Tambahkan validasi untuk equipmentIds di update
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

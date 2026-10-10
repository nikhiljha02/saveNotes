import { Router } from "express";
import user from "../database/userSchema.js";
// import user from "../database/";
import notesKeeperDB from "../database/notesSchema.js";
import { noteSchema } from "../zodLayer.js";
import { generateAccessToken, generateRefreshToken } from "../JWT/jwt.js";
// import cookieParser from "cookie-parser";
import authenticateToken from "../middleware/authCheck.js";
import "dotenv/config";
import jwt from "jsonwebtoken";

const router = Router();

// entry note
router.post("/entry", authenticateToken, async (req, res) => {
  let result = noteSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json(result.error.flatten());
  }
  let userId = req.user;

  let { note } = result.data;
  let existingUser = await user.findOne({ _id: userId });
  if (!existingUser.loggedIn) {
    return res.status(404).json({ info: "user not logged in" });
  }
  let noteData = await notesKeeperDB.create({
    userId: existingUser._id,
    note,
  });
  res
    .status(200)
    .json({ message: "Note Added Successfully", notesId: noteData._id });
});

// delete
router.delete("/delete", authenticateToken, async (req, res) => {
  let _id = req.body.noteId;
  let userId = req.user;
  let notes = await notesKeeperDB.deleteOne({ userId, _id });
  if (notes.acknowledged) {
    return res.status(200).json({ message: "Note Deleted successfully" });
  }
});

// Edit
router.patch("/edit", authenticateToken, async (req, res) => {
  let result = noteSchema.safeParse(req.body);
  let noteId = req.body.noteId;
  if (!result.success) {
    return res.status(400).json(result.error.flatten());
  }
  let userId = req.user;

  let { note } = result.data;
  let updatedNote = await notesKeeperDB.findOneAndUpdate(
    {
      _id: noteId,
      userId,
    },
    {
      $set: { note },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedNote) {
    return res.status(404).json({
      message: "Note not found",
    });
  }
  res.status(200).json({
    message: "Note updated successfully",
    data: updatedNote,
  });
});

//getAll
router.get("/notes", authenticateToken, async (req, res) => {
  let userNotes = [];
  let userId = req.user;

  let allNotes = await notesKeeperDB.find({ userId });
  userNotes = allNotes.map((ele) => {
    return { note: ele.note, noteId: ele._id };
  });
  return res.json({ allNotes: userNotes });
});

export default router;

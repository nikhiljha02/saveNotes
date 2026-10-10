import mongoose from "mongoose";
import bcrypt from "bcrypt";

const notesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    note: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

// notesSchema.pre("save", async function () {
//     // Only hash the password if it has been modified (or is new)
//     if (!this.isModified("clientSecret")) return;

//     try {
//         // Generate a salt and hash the password
//         this.clientSecret = await bcrypt.hash(this.clientSecret, 10);
//     } catch (error) {
//         console.log(error);
//     }
// });

// clientSchema.methods.comparePassword = async function (secret) {
//     // 'this.password' refers to the hashed password in the document
//     return await bcrypt.compare(secret, this.clientSecret);
// };
const notesKeeperDB = new mongoose.model("userNotes", notesSchema);

export default notesKeeperDB;

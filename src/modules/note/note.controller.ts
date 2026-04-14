import type { Request, Response } from "express";
import { createNoteSchema } from "./note.dto";
import * as NoteService from "./note.service";

export const addNote = async (req: Request, res: Response) => {
  const input = createNoteSchema.parse(req.body);
  const note = await NoteService.addNote(req.user, input);

  res.json({
    success: true,
    message: "Note added",
    data: note
  });
};

export const getNotes = async (req: Request, res: Response) => {
  const leadId = Array.isArray(req.params.leadId) ? req.params.leadId[0] : req.params.leadId;
  const data = await NoteService.getNotesByLead(req.user, leadId);

  res.json({
    success: true,
    message: "OK",
    data
  });
};


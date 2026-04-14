import { beforeEach, describe, expect, it, vi } from "vitest";

import * as NoteService from "./note.service";
import * as NoteRepo from "./note.repository";
import { Lead } from "../lead/lead.model";

vi.mock("./note.repository", async () => {
  const actual = await vi.importActual<typeof import("./note.repository")>("./note.repository");

  return {
    ...actual,
    createOpsNote: vi.fn(),
    createSalesNote: vi.fn(),
    getOpsNotesByLead: vi.fn(),
    getSalesNotesByLead: vi.fn()
  };
});

vi.mock("../lead/lead.model", async () => {
  const actual = await vi.importActual<typeof import("../lead/lead.model")>("../lead/lead.model");

  return {
    ...actual,
    Lead: {
      findOne: vi.fn()
    }
  };
});

describe("note.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("addNote rejects invalid lead id", async () => {
    await expect(
      NoteService.addNote(
        { id: "507f191e810c19729de860ea", role: "operations" },
        { leadId: "bad", content: "x" } as any
      )
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("addNote rejects missing lead", async () => {
    vi.mocked(Lead.findOne).mockResolvedValue(null as any);

    await expect(
      NoteService.addNote(
        { id: "507f191e810c19729de860ea", role: "operations" },
        { leadId: "507f191e810c19729de860eb", content: "x" } as any
      )
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("operations creates ops note", async () => {
    vi.mocked(Lead.findOne).mockResolvedValue({ _id: "l1" } as any);
    vi.mocked(NoteRepo.createOpsNote).mockResolvedValue({ _id: "n1" } as any);

    await NoteService.addNote(
      { id: "507f191e810c19729de860ea", role: "operations" },
      { leadId: "507f191e810c19729de860eb", content: "hello" } as any
    );

    expect(NoteRepo.createOpsNote).toHaveBeenCalled();
    expect(NoteRepo.createSalesNote).not.toHaveBeenCalled();
  });

  it("sales creates sales note", async () => {
    vi.mocked(Lead.findOne).mockResolvedValue({ _id: "l1" } as any);
    vi.mocked(NoteRepo.createSalesNote).mockResolvedValue({ _id: "n1" } as any);

    await NoteService.addNote(
      { id: "507f191e810c19729de860ea", role: "sales" },
      { leadId: "507f191e810c19729de860eb", content: "hello" } as any
    );

    expect(NoteRepo.createSalesNote).toHaveBeenCalled();
    expect(NoteRepo.createOpsNote).not.toHaveBeenCalled();
  });

  it("admin cannot create notes", async () => {
    vi.mocked(Lead.findOne).mockResolvedValue({ _id: "l1" } as any);

    await expect(
      NoteService.addNote(
        { id: "507f191e810c19729de860ea", role: "admin" },
        { leadId: "507f191e810c19729de860eb", content: "hello" } as any
      )
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("getNotesByLead admin returns both", async () => {
    vi.mocked(Lead.findOne).mockResolvedValue({ _id: "l1" } as any);
    vi.mocked(NoteRepo.getOpsNotesByLead).mockResolvedValue([{ _id: "o1" }] as any);
    vi.mocked(NoteRepo.getSalesNotesByLead).mockResolvedValue([{ _id: "s1" }] as any);

    const res = await NoteService.getNotesByLead(
      { id: "507f191e810c19729de860ea", role: "admin" },
      "507f191e810c19729de860eb"
    );

    expect(res.opsNotes).toHaveLength(1);
    expect(res.salesNotes).toHaveLength(1);
  });

  it("getNotesByLead operations returns ops only", async () => {
    vi.mocked(Lead.findOne).mockResolvedValue({ _id: "l1" } as any);
    vi.mocked(NoteRepo.getOpsNotesByLead).mockResolvedValue([{ _id: "o1" }] as any);

    const res = await NoteService.getNotesByLead(
      { id: "507f191e810c19729de860ea", role: "operations" },
      "507f191e810c19729de860eb"
    );

    expect(res.opsNotes).toHaveLength(1);
    expect(res.salesNotes).toHaveLength(0);
    expect(NoteRepo.getSalesNotesByLead).not.toHaveBeenCalled();
  });

  it("getNotesByLead sales returns sales only", async () => {
    vi.mocked(Lead.findOne).mockResolvedValue({ _id: "l1" } as any);
    vi.mocked(NoteRepo.getSalesNotesByLead).mockResolvedValue([{ _id: "s1" }] as any);

    const res = await NoteService.getNotesByLead(
      { id: "507f191e810c19729de860ea", role: "sales" },
      "507f191e810c19729de860eb"
    );

    expect(res.opsNotes).toHaveLength(0);
    expect(res.salesNotes).toHaveLength(1);
    expect(NoteRepo.getOpsNotesByLead).not.toHaveBeenCalled();
  });
});


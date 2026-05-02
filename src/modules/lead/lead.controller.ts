import type { Request, Response } from "express";
import { createLeadSchema, listLeadSchema, updateLeadSchema } from "./lead.dto";
import * as LeadService from "./lead.service";

export const createLead = async (req: Request, res: Response) => {
  const input = createLeadSchema.parse(req.body);
  const lead = await LeadService.createLead(req.user!.id, input);

  res.json({
    success: true,
    message: "Lead created",
    data: lead
  });
};

export const getLeads = async (req: Request, res: Response) => {
  const input = listLeadSchema.parse(req.query);
  const result = await LeadService.getLeads(input, req.user!);

  res.json({
    success: true,
    message: "OK",
    data: result
  });
};

export const getLeadById = async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const lead = await LeadService.getLeadById({ id: req.user!.id, role: req.user!.role }, id);

  res.json({
    success: true,
    message: "OK",
    data: lead
  });
};

export const updateLead = async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const input = updateLeadSchema.parse(req.body);
  const lead = await LeadService.updateLead(id, input, req.user!);

  res.json({
    success: true,
    message: "Lead updated",
    data: lead
  });
};


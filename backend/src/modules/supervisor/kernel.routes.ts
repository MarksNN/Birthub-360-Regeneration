import { Router, Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import {
  addMissionData,
  approveMission,
  cancelMission,
  getMission,
  listMissionSummaries,
  resumeMission,
  SessionUser,
  startMission,
} from "./kernel/birthub-session";

const router = Router();

const slotsSchema = z
  .object({
    accountId: z.string().min(1).optional(),
    newStage: z.string().min(1).optional(),
    requestedSystem: z.string().min(1).optional(),
  })
  .optional();

const startSchema = z.object({
  prompt: z.string().min(2),
  correlationId: z.string().min(3).max(80).optional(),
  document: z.string().max(8000).optional(),
  explicitOrganizationId: z.string().min(1).optional(),
  slots: slotsSchema,
});

function userOf(req: AuthenticatedRequest): SessionUser {
  return {
    userId: req.user!.userId,
    organizationId: req.user!.organizationId,
    email: req.user!.email,
    role: req.user!.role,
  };
}

router.post("/missions", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = startSchema.parse(req.body);
    const result = await startMission(userOf(req), {
      text: data.prompt,
      correlationId: data.correlationId,
      document: data.document,
      explicitOrganizationId: data.explicitOrganizationId,
      slots: data.slots,
    });
    res.status(result.replayed ? 200 : 201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get("/missions", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = await listMissionSummaries(req.user!.organizationId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/missions/:id", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const mission = await getMission(req.user!.organizationId, req.params.id);
    if (!mission) {
      res.status(404).json({ success: false, error: "Missão não encontrada nesta organização." });
      return;
    }
    res.json({ success: true, data: mission });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/missions/:id/approve", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const body = z
      .object({ approvalId: z.string().min(1), decision: z.enum(["aprovada", "rejeitada"]) })
      .parse(req.body);
    const result = await approveMission(userOf(req), req.params.id, body.approvalId, body.decision);
    if (!result?.mission) {
      res.status(404).json({ success: false, error: result?.error || "Missão ou aprovação não encontrada nesta organização." });
      return;
    }
    res.status(result.ok ? 200 : 403).json({
      success: result.ok,
      error: result.ok ? undefined : result.error,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/missions/:id/resume", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await resumeMission(userOf(req), req.params.id);
    if (!result?.mission) {
      res.status(404).json({ success: false, error: "Missão não encontrada nesta organização." });
      return;
    }
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/missions/:id/cancel", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const result = await cancelMission(userOf(req), req.params.id);
    if (!result?.mission) {
      res.status(404).json({ success: false, error: "Missão não encontrada nesta organização." });
      return;
    }
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post("/missions/:id/data", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const body = z.object({ slots: slotsSchema }).parse(req.body);
    const result = await addMissionData(userOf(req), req.params.id, body.slots ?? {});
    if (!result?.mission) {
      res.status(404).json({ success: false, error: "Missão não encontrada nesta organização." });
      return;
    }
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;

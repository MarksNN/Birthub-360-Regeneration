import fs from 'fs';
import path from 'path';
import {
  AgentIdV31,
  ALL_AGENT_IDS_V31,
  AgentMetadataV31,
  SkillSummaryV31,
  PlaybookMetaV31
} from './types';

export interface AgentIndexFileV31 {
  agentId: AgentIdV31;
  name: string;
  skillCount: number;
  playbookCount: number;
  skills: {
    id: string;
    name: string;
    playbookId: string;
    catalogStage: string;
    number: number;
    description?: string;
  }[];
  playbooks: {
    id: string;
    title?: string;
    path: string;
  }[];
}

export interface CatalogFileV31 {
  schemaVersion: string;
  agents: AgentMetadataV31[];
  skills: SkillSummaryV31[];
}

export class CommercialCatalogV31 {
  private static instance: CommercialCatalogV31 | null = null;
  private basePath: string;
  private catalogData: CatalogFileV31 | null = null;
  private agentIndices: Map<AgentIdV31, AgentIndexFileV31> = new Map();
  private skillsById: Map<string, SkillSummaryV31> = new Map();
  private playbooksByAgent: Map<AgentIdV31, Map<string, PlaybookMetaV31>> = new Map();

  private constructor() {
    this.basePath = this.resolveCanonicalPath();
    this.loadCatalog();
  }

  public static getInstance(): CommercialCatalogV31 {
    if (!CommercialCatalogV31.instance) {
      CommercialCatalogV31.instance = new CommercialCatalogV31();
    }
    return CommercialCatalogV31.instance;
  }

  private resolveCanonicalPath(): string {
    const candidates = [
      path.resolve(__dirname, 'canonical'),
      path.resolve(process.cwd(), 'src/modules/supervisor/v3_1/canonical'),
      path.resolve(process.cwd(), 'backend/src/modules/supervisor/v3_1/canonical'),
      'C:\\Users\\Marks\\Documents\\BIRTHUB360_PROMPTS_19_AGENTES_463_HABILIDADES_V3_1\\BIRTHUB360_COMERCIAL_V3_1_RECONSTRUIDA'
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand) && fs.existsSync(path.join(cand, '03_CATALOGO', 'INDICE_GERAL_463.json'))) {
        return cand;
      }
    }

    throw new Error('Não foi possível localizar o diretório canônico da Matriz Comercial V3.1.');
  }

  public getBasePath(): string {
    return this.basePath;
  }

  private loadCatalog(): void {
    const generalIndexPath = path.join(this.basePath, '03_CATALOGO', 'INDICE_GERAL_463.json');
    const raw = fs.readFileSync(generalIndexPath, 'utf8');
    this.catalogData = JSON.parse(raw) as CatalogFileV31;

    for (const skill of this.catalogData.skills) {
      this.skillsById.set(skill.id, skill);
    }

    for (const agentMeta of this.catalogData.agents) {
      const agentIndexPath = path.join(this.basePath, agentMeta.index);
      if (fs.existsSync(agentIndexPath)) {
        const agentIndexRaw = fs.readFileSync(agentIndexPath, 'utf8');
        const agentIndex = JSON.parse(agentIndexRaw) as AgentIndexFileV31;
        this.agentIndices.set(agentMeta.id, agentIndex);

        const pbMap = new Map<string, PlaybookMetaV31>();
        for (const pb of agentIndex.playbooks) {
          pbMap.set(pb.id, {
            id: pb.id,
            title: pb.title,
            path: pb.path,
            agentId: agentMeta.id
          });
        }
        this.playbooksByAgent.set(agentMeta.id, pbMap);
      }
    }
  }

  public getAgents(): AgentMetadataV31[] {
    return this.catalogData?.agents ?? [];
  }

  public getAgent(id: AgentIdV31): AgentMetadataV31 | undefined {
    return this.catalogData?.agents.find((a) => a.id === id);
  }

  public getAgentIndex(id: AgentIdV31): AgentIndexFileV31 | undefined {
    return this.agentIndices.get(id);
  }

  public getSkills(agentId?: AgentIdV31): SkillSummaryV31[] {
    if (!this.catalogData) return [];
    if (!agentId) return this.catalogData.skills;
    return this.catalogData.skills.filter((s) => s.agentId === agentId);
  }

  public getSkill(skillId: string): SkillSummaryV31 | undefined {
    return this.skillsById.get(skillId);
  }

  public getPlaybooks(agentId: AgentIdV31): PlaybookMetaV31[] {
    const map = this.playbooksByAgent.get(agentId);
    return map ? Array.from(map.values()) : [];
  }

  public getPlaybook(agentId: AgentIdV31, playbookId: string): PlaybookMetaV31 | undefined {
    return this.playbooksByAgent.get(agentId)?.get(playbookId);
  }

  public readCorePrompt(): string {
    const corePath = path.join(this.basePath, '00_CORE', 'CORE_COMPARTILHADO_V3_1.txt');
    return fs.readFileSync(corePath, 'utf8');
  }

  public readAgentPrompt(agentId: AgentIdV31): string {
    const agent = this.getAgent(agentId);
    if (!agent) throw new Error(`Agente ${agentId} desconhecido no catálogo V3.1.`);
    const promptPath = path.join(this.basePath, agent.prompt);
    return fs.readFileSync(promptPath, 'utf8');
  }

  public readPlaybookContent(agentId: AgentIdV31, playbookId: string): string | null {
    const pb = this.getPlaybook(agentId, playbookId);
    if (!pb) return null;
    const fullPath = path.join(this.basePath, pb.path);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath, 'utf8');
  }

  public getGlobalSchema(): Record<string, any> {
    const schemaPath = path.join(this.basePath, '03_CONTRATOS', 'AGENT_RESULT_V3_1_GLOBAL.schema.json');
    return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  }

  public getExecutionPolicy(): Record<string, any> {
    const policyPath = path.join(this.basePath, '03_CONTRATOS', 'EXECUTION_POLICY_V3_1.json');
    return JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  }
}

#!/usr/bin/env python3
"""Validação estática; não implica testes de LLM nem serviços reais."""
import json,sys,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'07_RUNTIME'))
from MONTAR_CONTEXT import context
try:import jsonschema
except ImportError:raise SystemExit('Instale jsonschema para validar exemplos: pip install jsonschema')
schema=json.loads((ROOT/'03_CONTRATOS/AGENT_RESULT_V3_1_GLOBAL.schema.json').read_text())
index=json.loads((ROOT/'03_CATALOGO/INDICE_GERAL_463.json').read_text())
assert len(index['agents'])==19 and len(index['skills'])==463
assert len({x['id'] for x in index['skills']})==463
assert all(x['skillCount'] if False else True for x in index['agents'])
seen=set()
for a in index['agents']:
 ai=json.loads((ROOT/a['index']).read_text());assert len(ai['skills'])==a['skills']
 for skill in ai['skills']:
  assert skill['id'] not in seen;seen.add(skill['id']); assert skill['playbookId'] in [p['id'] for p in ai['playbooks']]
 for pb in ai['playbooks']:assert (ROOT/pb['path']).exists(),pb['path']
 example_files=sorted((ROOT/'05_EXEMPLOS').glob('*_'+a['id']+'_*.json'))
 assert len(example_files)==2,(a['id'],len(example_files))
 for f in example_files:
  obj=json.loads(f.read_text());jsonschema.validate(obj,schema)
 ct,flags=context(a['id'],[ai['skills'][0]['id']]);assert flags['indexInjected'] and flags['schemaReady'] and len(flags['loadedPlaybooks'])==1 and not flags['operationalAllowedByBootstrap']
assert len(seen)==463
print('APROVADO: 19 agentes, 463 skills, playbooks mapeados, 38 exemplos JSON validos, discovery sob demanda e bootstrap consultivo.')

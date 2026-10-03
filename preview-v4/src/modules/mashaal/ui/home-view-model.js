import { MASHAAL_KG3_DOMAINS } from '../curriculum/kg3-curriculum.js';
import { MASHAAL_KG3_DOMAIN_ORDER } from '../data/kg3-domain-order.js';
import { MASHAAL_CHILD_DOMAIN_LABELS } from '../data/domain-labels.js';

export function getMashaalHomeDomains(){
  const byId=new Map(MASHAAL_KG3_DOMAINS.map(domain=>[domain.id,domain]));
  return MASHAAL_KG3_DOMAIN_ORDER.map(id=>({
    id,
    title:MASHAAL_CHILD_DOMAIN_LABELS[id]||byId.get(id)?.childTitle||byId.get(id)?.title||id
  }));
}

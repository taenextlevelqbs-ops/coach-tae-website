import { expect, it } from 'vitest';
import { emptyDemo, sendDemo } from '@/modules/qb-lab/membership/demo';
it('keeps acknowledgement IDs unique after the bounded synthetic inbox fills', () => {
 let state = emptyDemo;
 for (let i = 0; i < 110; i++) state = sendDemo(state, ['demo-jordan'], 0, 0);
 expect(state.messages).toHaveLength(100);
 expect(new Set(state.messages.map(m => m.id)).size).toBe(100);
 expect(state.audit).toHaveLength(100);
});

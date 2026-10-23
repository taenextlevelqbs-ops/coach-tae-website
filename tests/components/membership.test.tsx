import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { WorkflowDemo } from '@/modules/qb-lab/membership/WorkflowDemo';
import { AccountHelp } from '@/modules/qb-lab/membership/AccountHelp';
import { MemberInbox } from '@/modules/qb-lab/membership/MemberInbox';
it('walks coach to guardian delivery and acknowledgement without requests or browser persistence', async () => {
 const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher); localStorage.clear(); sessionStorage.clear();
 const user = userEvent.setup(); render(<WorkflowDemo />);
 await user.click(screen.getByRole('button', { name: 'Send synthetic message' }));
 await user.selectOptions(screen.getByLabelText('Preview perspective'), 'guardian');
 expect(screen.getByText(/Great work this week/)).toBeVisible();
 await user.click(screen.getByRole('button', { name: 'Mark read' }));
 expect(screen.getByText('Read in demonstration')).toBeVisible();
 await user.selectOptions(screen.getByLabelText('Preview perspective'), 'athlete');
 await user.selectOptions(screen.getByLabelText('Synthetic athlete'), 'demo-alex');
 expect(screen.queryByText(/Great work this week/)).not.toBeInTheDocument();
 expect(fetcher).not.toHaveBeenCalled(); expect(localStorage.length).toBe(0); expect(sessionStorage.length).toBe(0); vi.unstubAllGlobals();
});
it('collects no credentials or private records while services are disabled', () => {
 const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
 const { container } = render(<><AccountHelp enabled={false} emailEnabled={false} /><MemberInbox enabled={false} /></>);
 expect(container.querySelectorAll('input,textarea')).toHaveLength(0); expect(fetcher).not.toHaveBeenCalled(); vi.unstubAllGlobals();
});

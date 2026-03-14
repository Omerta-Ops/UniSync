/**
 * Dashboard Page — Main inbox view.
 */

import { Shell } from '../components/layout/Shell';
import { EmailList } from '../components/inbox/EmailList';
import { EmailDetail } from '../components/inbox/EmailDetail';

export function DashboardPage() {
  return (
    <Shell detailPanel={<EmailDetail />}>
      <EmailList />
    </Shell>
  );
}

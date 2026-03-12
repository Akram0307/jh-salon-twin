import StaffMobileShell from '../../components/layout/StaffMobileShell';
import StaffScheduleTimeline from '../../features/staff/StaffScheduleTimeline';

export default function StaffSchedulePage() {
  return (
    <StaffMobileShell title="Schedule">
      <div className="pb-24">
        <StaffScheduleTimeline />
      </div>
    </StaffMobileShell>
  );
}

import { OperationsLayout } from '../../components/layout/OperationsLayout';
import { RoleSurface } from '../../components/ops/RoleSurface';
import { GlassCard } from '../../components/ui/GlassCard';
import { glass, semantic, component } from '../../lib/design-tokens';

export const FrontdeskStaffPage: React.FC = () => {
  return (
    <OperationsLayout roleLabel="Frontdesk" roleTitle="Operations" homePath="/frontdesk" navItems={[]} title="Staff Management">
      <div className="p-6 space-y-6">
        <RoleSurface title="Staff Overview" description="Manage team schedules, performance, and availability.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6 rounded-[28px] border semantic.border.default bg-zinc-900/70 backdrop-blur-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Scheduling</h3>
              <p className="text-zinc-400">Manage weekly shifts and assignments.</p>
            </GlassCard>
            <GlassCard className="p-6 rounded-[28px] border semantic.border.default bg-zinc-900/70 backdrop-blur-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
              <p className="text-zinc-400">View real-time staff KPIs and metrics.</p>
            </GlassCard>
            <GlassCard className="p-6 rounded-[28px] border semantic.border.default bg-zinc-900/70 backdrop-blur-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Availability</h3>
              <p className="text-zinc-400">Monitor staff status and time-off requests.</p>
            </GlassCard>
          </div>
        </RoleSurface>
      </div>
    </OperationsLayout>
  );
};

export default FrontdeskStaffPage;

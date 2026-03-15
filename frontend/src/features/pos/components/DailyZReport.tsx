import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

interface Payment {
  id: string;
  amount: number;
  method: 'cash' | 'phonepe' | 'card' | 'upi';
  reference?: string;
  tip: number;
  timestamp: string;
  items: Array<{ id: string; name: string; price: number }>;
}

interface ZReportData {
  date: string;
  totalSales: number;
  totalTips: number;
  totalTransactions: number;
  paymentBreakdown: {
    cash: { count: number; amount: number };
    phonepe: { count: number; amount: number };
    card: { count: number; amount: number };
    upi: { count: number; amount: number };
  };
  payments: Payment[];
}

export default function DailyZReport() {
  const [reportData, setReportData] = useState<ZReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDetails, setShowDetails] = useState(false);

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: '💵', color: 'oklch(0.723 0.219 149)' },
    { id: 'phonepe', label: 'PhonePe', icon: '📱', color: 'oklch(0.623 0.214 259)' },
    { id: 'card', label: 'Card', icon: '💳', color: 'oklch(0.554 0.017 247)' },
    { id: 'upi', label: 'UPI', icon: '📲', color: 'oklch(0.769 0.188 70)' },
  ];

  useEffect(() => {
    fetchReportData();
  }, [selectedDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/pos/z-report`, {
        params: { date: selectedDate }
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to fetch Z-Report:', error);
      // Use mock data for demo
      setReportData(generateMockData(selectedDate));
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (date: string): ZReportData => ({
    date,
    totalSales: 15750,
    totalTips: 1250,
    totalTransactions: 23,
    paymentBreakdown: {
      cash: { count: 8, amount: 4500 },
      phonepe: { count: 6, amount: 4200 },
      card: { count: 5, amount: 4050 },
      upi: { count: 4, amount: 3000 },
    },
    payments: [],
  });

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        color: 'oklch(0.446 0.017 247)',
      }}>
        Loading Z-Report...
      </div>
    );
  }

  if (!reportData) {
    return (
      <div style={{
        padding: 20,
        textAlign: 'center',
        color: 'oklch(0.446 0.017 247)',
      }}>
        No data available for selected date
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: 24,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'oklch(0.208 0.011 247)' }}>
            📊 Daily Z-Report
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'oklch(0.446 0.017 247)', fontSize: 14 }}>
            End-of-day reconciliation
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid oklch(0.929 0.009 247)',
            fontSize: 14,
          }}
        />
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <SummaryCard
          label="Total Sales"
          value={formatCurrency(reportData.totalSales)}
          icon="💰"
          color="oklch(0.723 0.219 149)"
        />
        <SummaryCard
          label="Total Tips"
          value={formatCurrency(reportData.totalTips)}
          icon="🎁"
          color="oklch(0.623 0.214 259)"
        />
        <SummaryCard
          label="Transactions"
          value={reportData.totalTransactions.toString()}
          icon="🧾"
          color="oklch(0.769 0.188 70)"
        />
        <SummaryCard
          label="Avg. Ticket"
          value={formatCurrency(reportData.totalSales / (reportData.totalTransactions || 1))}
          icon="📈"
          color="oklch(0.554 0.017 247)"
        />
      </div>

      {/* Payment Breakdown */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: 'oklch(0.208 0.011 247)' }}>
          Payment Breakdown
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {paymentMethods.map((method) => {
            const data = reportData.paymentBreakdown[method.id as keyof typeof reportData.paymentBreakdown];
            const percentage = (data.amount / reportData.totalSales) * 100;
            return (
              <div
                key={method.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'oklch(0.984 0.003 247)',
                  borderRadius: 12,
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 24 }}>{method.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, color: 'oklch(0.208 0.011 247)' }}>
                      {method.label}
                    </span>
                    <span style={{ fontWeight: 600, color: 'oklch(0.208 0.011 247)' }}>
                      {formatCurrency(data.amount)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        flex: 1,
                        height: 6,
                        background: 'oklch(0.929 0.009 247)',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: method.color,
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: 'oklch(0.446 0.017 247)', minWidth: 40 }}>
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: 'oklch(0.446 0.017 247)' }}>
                    {data.count} transactions
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reconciliation Section */}
      <div
        style={{
          background: 'oklch(0.968 0.005 247)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: 'oklch(0.208 0.011 247)' }}>
          Reconciliation
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ReconciliationRow
            label="Expected Cash in Drawer"
            value={formatCurrency(reportData.paymentBreakdown.cash.amount)}
          />
          <ReconciliationRow
            label="Digital Payments (PhonePe + UPI)"
            value={formatCurrency(
              reportData.paymentBreakdown.phonepe.amount +
              reportData.paymentBreakdown.upi.amount
            )}
          />
          <ReconciliationRow
            label="Card Payments"
            value={formatCurrency(reportData.paymentBreakdown.card.amount)}
          />
          <div
            style={{
              borderTop: '1px solid oklch(0.929 0.009 247)',
              paddingTop: 8,
              marginTop: 4,
            }}
          >
            <ReconciliationRow
              label="Grand Total"
              value={formatCurrency(reportData.totalSales)}
              bold
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => window.print()}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            border: '1px solid oklch(0.929 0.009 247)',
            background: 'white',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          🖨️ Print Report
        </button>
        <button
          onClick={() => {
            // Export to CSV logic
            const csvContent = generateCSV(reportData);
            downloadCSV(csvContent, `z-report-${selectedDate}.csv`);
          }}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 10,
            border: 'none',
            background: 'oklch(0.723 0.219 149)',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          📥 Export CSV
        </button>
      </div>
    </div>
  );
}

// Helper Components
function SummaryCard({ label, value, icon, color }: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: 'oklch(0.968 0.005 247)',
        borderRadius: 12,
        padding: 16,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'oklch(0.208 0.011 247)', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'oklch(0.446 0.017 247)' }}>{label}</div>
    </div>
  );
}

function ReconciliationRow({ label, value, bold = false }: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'oklch(0.446 0.017 247)', fontWeight: bold ? 600 : 400 }}>
        {label}
      </span>
      <span style={{ fontWeight: bold ? 700 : 500, color: 'oklch(0.208 0.011 247)' }}>
        {value}
      </span>
    </div>
  );
}

// CSV Export Helpers
function generateCSV(data: ZReportData): string {
  const rows = [
    ['Daily Z-Report', data.date],
    [''],
    ['Summary'],
    ['Total Sales', data.totalSales.toString()],
    ['Total Tips', data.totalTips.toString()],
    ['Total Transactions', data.totalTransactions.toString()],
    [''],
    ['Payment Breakdown'],
    ['Method', 'Count', 'Amount'],
    ['Cash', data.paymentBreakdown.cash.count.toString(), data.paymentBreakdown.cash.amount.toString()],
    ['PhonePe', data.paymentBreakdown.phonepe.count.toString(), data.paymentBreakdown.phonepe.amount.toString()],
    ['Card', data.paymentBreakdown.card.count.toString(), data.paymentBreakdown.card.amount.toString()],
    ['UPI', data.paymentBreakdown.upi.count.toString(), data.paymentBreakdown.upi.amount.toString()],
  ];
  return rows.map(row => row.join(',')).join('\n');
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

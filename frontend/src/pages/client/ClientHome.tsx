
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { glass, semantic, component } from '../../lib/design-tokens';

export default function ClientHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <header className="text-center py-8">
          <h1 className="text-3xl font-bold text-white">Welcome to SalonOS</h1>
          <p className="text-zinc-400 mt-2">Discover your next look</p>
        </header>

        {/* Discovery Dashboard Container */}
        <div className="rounded-[28px] border semantic.border.default bg-zinc-900/70 backdrop-blur-lg p-6 shadow-2xl">
          <Card className="bg-transparent border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-white">Explore Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300">Ready to book your next appointment?</p>
              <Button 
                className="w-full bg-white text-zinc-900 hover:bg-zinc-200"
                onClick={() => navigate('/client/chat')}
              >
                Start Booking
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

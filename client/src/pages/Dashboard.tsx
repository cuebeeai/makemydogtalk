import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { VideoOperation } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import CheckoutDialog from '@/components/CheckoutDialog';
import { PRODUCTS } from '@/lib/products';
import { Coins, ShoppingCart, User as UserIcon, PawPrint, Play, ArrowLeft, LogOut } from 'lucide-react';
import { Link } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [credits, setCredits] = useState(0);
  const [videos, setVideos] = useState<VideoOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ priceId: string; name: string } | null>(null);

  const isAdmin = user?.email === import.meta.env.VITE_ADMIN_EMAIL;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch credits
        const creditsRes = await fetch('/api/credits');
        const creditsData = await creditsRes.json();
        if (creditsRes.ok) {
          setCredits(creditsData.credits);
        }

        // Fetch user's videos
        const videosRes = await fetch('/api/my-videos');
        const videosData = await videosRes.json();
        if (videosRes.ok) {
          setVideos(videosData);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast({
          title: "Error",
          description: "Could not load your dashboard data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, toast]);

  const handleOpenCheckout = (product: { priceId: string; name: string }) => {
    setSelectedProduct(product);
    setCheckoutOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-6 py-4 md:py-8">
          <header className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Account Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your creations and credits.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Available Credits Card */}
            <div className="bg-card border p-8 rounded-lg shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Coins className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">Available Credits</h2>
                </div>
                <div className="flex items-baseline gap-4">
                  <p className="text-7xl font-bold text-foreground">{isAdmin ? '∞' : credits}</p>
                  {isAdmin && <p className="text-lg font-medium text-muted-foreground">Admin Account</p>}
                </div>
              </div>
              {!isAdmin && (
                <div className="flex items-center gap-3 mt-6">
                  <Button onClick={() => handleOpenCheckout(PRODUCTS.JUMP_LINE)}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy 1 Credit (${PRODUCTS.JUMP_LINE.price})
                  </Button>
                  <Button onClick={() => handleOpenCheckout(PRODUCTS.THREE_PACK)}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Buy 3 Credits (${PRODUCTS.THREE_PACK.price})
                  </Button>
                </div>
              )}
            </div>

            {/* Profile Info Card */}
            <div className="bg-card border p-8 rounded-lg shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <UserIcon className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">Profile</h2>
                </div>
                <p className="text-muted-foreground mt-2">
                  Logged in as <span className="font-semibold text-foreground">{user?.email}</span>.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {user?.picture ? 'Google Account' : 'Email Account'}
                </p>
              </div>
              <div className="flex flex-col gap-3 mt-6">
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Create a New Video
                  </Button>
                </Link>
                <Button variant="outline" className="w-full" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </div>
            </div>
          </div>

          {/* Video Library */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <PawPrint className="h-7 w-7 text-primary" />
              <h2 className="text-3xl font-bold tracking-tight text-foreground">My Creations</h2>
            </div>
            {videos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {videos.map((video) => (
                  <div key={video.id} className="relative group aspect-square">
                    <video
                      src={video.videoUrl!}
                      className="rounded-lg w-full h-full object-cover bg-muted"
                      preload="metadata"
                    />
                    <a href={video.videoUrl!} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <div className="h-14 w-14 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="h-8 w-8 text-primary fill-primary ml-1" />
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <PawPrint className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No Videos Yet!</h3>
                <p className="mt-1 text-muted-foreground">Videos you create while logged in will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      {selectedProduct && (
        <CheckoutDialog
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
          priceId={selectedProduct.priceId}
          productName={selectedProduct.name}
        />
      )}
      <Footer />
    </div>
  );
};

export default Dashboard;

import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Recycle, 
  Users, 
  Shield, 
  Trophy,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export const Landing = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };
1
  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onLoginClick={handleLogin} />
      
      <Hero onGetStarted={handleGetStarted} />
      
      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How Swappo Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, transparent, and rewarding trading in just 4 easy steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                icon: <Recycle className="h-8 w-8" />,
                title: "Post Your Item",
                description: "Upload photos and details of items you want to trade"
              },
              {
                step: "2", 
                icon: <Users className="h-8 w-8" />,
                title: "Receive Offers",
                description: "Get trade requests from community members"
              },
              {
                step: "3",
                icon: <CheckCircle className="h-8 w-8" />,
                title: "Choose & Meet",
                description: "Select the best offer and arrange a safe meetup"
              },
              {
                step: "4",
                icon: <Trophy className="h-8 w-8" />,
                title: "Rate & Earn",
                description: "Complete the trade and earn points & badges"
              }
            ].map((step, index) => (
              <Card key={index} className="text-center relative overflow-hidden group hover:shadow-medium transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-card opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <CardHeader className="relative">
                  <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {step.step}
                  </div>
                  <div className="text-primary mb-4 flex justify-center">
                    {step.icon}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose Swappo?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for trust, transparency, and community connection
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-12 w-12 text-primary" />,
                title: "Safe & Trusted",
                description: "Public trade requests, verified ratings, and community-driven trust system ensure safe trading."
              },
              {
                icon: <Trophy className="h-12 w-12 text-primary" />,
                title: "Earn Rewards", 
                description: "Build your reputation with loyalty points and badges. From Bronze to Ruby Trader levels."
              },
              {
                icon: <Recycle className="h-12 w-12 text-primary" />,
                title: "Eco-Friendly",
                description: "Reduce waste and environmental impact by giving items a second life in your community."
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center p-8 hover:shadow-medium transition-all duration-300 group">
                <div className="mb-6 flex justify-center group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of community members already trading, saving money, and reducing waste.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-medium"
          >
            Join Swappo Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="bg-gradient-hero p-2 rounded-lg">
              <Recycle className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary">Swappo</span>
          </div>
          <p className="text-muted-foreground">
            © 2024 Swappo. Building sustainable communities through item trading.
          </p>
        </div>
      </footer>
    </div>
  );
};

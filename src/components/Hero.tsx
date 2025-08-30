import { Button } from "@/components/ui/button";
import { ArrowRight, Recycle, Users, Award } from "lucide-react";
import heroImage from "@/assets/hero-swappo.jpg";

interface HeroProps {
  onGetStarted?: () => void;
  onLearnMore?: () => void;
}

export const Hero = ({ onGetStarted, onLearnMore }: HeroProps) => {
  return (
    <section className="relative min-h-[90vh] bg-gradient-hero overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="People swapping items in community" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-20 flex items-center min-h-[90vh]">
        <div className="max-w-3xl space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-primary-foreground/20 backdrop-blur-sm text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
            <Recycle className="h-4 w-4" />
            <span>Sustainable Community Trading</span>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground leading-tight">
              Trade, Reuse,{" "}
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                Connect
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 max-w-2xl leading-relaxed">
              Join your local community in trading unused items. Reduce waste, save money, 
              and build meaningful connections through sustainable swapping.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={onGetStarted}
              size="lg" 
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-medium"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={onLearnMore}
              variant="outline" 
              size="lg"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-8">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-primary-foreground/20 p-3 rounded-lg">
                  <Recycle className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div className="text-2xl font-bold text-primary-foreground">10k+</div>
              <div className="text-sm text-primary-foreground/80">Items Swapped</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-primary-foreground/20 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div className="text-2xl font-bold text-primary-foreground">5k+</div>
              <div className="text-sm text-primary-foreground/80">Active Traders</div>
            </div>
            
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="bg-primary-foreground/20 p-3 rounded-lg">
                  <Award className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <div className="text-2xl font-bold text-primary-foreground">4.8★</div>
              <div className="text-sm text-primary-foreground/80">User Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -bottom-1 left-0 right-0 h-20 bg-background transform skew-y-2 origin-bottom-left" />
    </section>
  );
};
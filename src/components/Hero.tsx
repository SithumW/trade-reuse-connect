import { Button } from "@/components/ui/button";
import { ArrowRight, Recycle, Users, Award } from "lucide-react";
import heroImage from "@/assets/hero-swappo.jpg";
import "@/styles/components/Hero.css";

interface HeroProps {
  onGetStarted?: () => void;
  onLearnMore?: () => void;
}

export const Hero = ({ onGetStarted, onLearnMore }: HeroProps) => {
  return (
    <section className="hero">
      {/* Background Image with Overlay */}
      <div className="hero-background">
        <img 
          src={heroImage} 
          alt="People swapping items in community" 
          className="hero-image"
        />
        <div className="hero-overlay" />
      </div>

      {/* Content */}
      <div className="hero-content">
        <div className="hero-content-inner">
          {/* Badge */}
          <div className="hero-badge">
            <Recycle className="hero-badge-icon" />
            <span>Sustainable Community Trading</span>
          </div>

          {/* Main Heading */}
          <div className="hero-heading-section">
            <h1 className="hero-title">
              Trade, Reuse,{" "}
              <span className="hero-accent-text">
                Connect
              </span>
            </h1>
            <p className="hero-subtitle">
              Join your local community in trading unused items. Reduce waste, save money, 
              and build meaningful connections through sustainable swapping.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="hero-cta-section">
            <Button 
              onClick={onGetStarted}
              className="hero-btn-primary"
            >
              Get Started Free
              <ArrowRight className="hero-btn-icon" />
            </Button>
            <Button 
              onClick={onLearnMore}
              className="hero-btn-secondary"
            >
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <div className="hero-stat-item">
              <div className="hero-stat-icon-container">
                <div className="hero-stat-icon-bg">
                  <Recycle className="hero-stat-icon" />
                </div>
              </div>
              <div className="hero-stat-number">10k+</div>
              <div className="hero-stat-label">Items Swapped</div>
            </div>
            
            <div className="hero-stat-item">
              <div className="hero-stat-icon-container">
                <div className="hero-stat-icon-bg">
                  <Users className="hero-stat-icon" />
                </div>
              </div>
              <div className="hero-stat-number">5k+</div>
              <div className="hero-stat-label">Active Traders</div>
            </div>
            
            <div className="hero-stat-item">
              <div className="hero-stat-icon-container">
                <div className="hero-stat-icon-bg">
                  <Award className="hero-stat-icon" />
                </div>
              </div>
              <div className="hero-stat-number">4.8★</div>
              <div className="hero-stat-label">User Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="hero-decorative" />
    </section>
  );
};
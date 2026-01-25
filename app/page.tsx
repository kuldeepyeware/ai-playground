"use client";

import HeroSection from "@/components/landing/HeroSection";
import Header from "@/components/landing/Header";
import ComparisonInput from "@/components/landing/ComparisonInput";
import StatsSection from "@/components/landing/StatsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorks from "@/components/landing/HowItWorks";

const Home = () => {
  return (
    <div className='min-h-screen bg-background'>
      <Header />

      <main className='mx-auto max-w-7xl'>
        {/* Hero Section */}
        <HeroSection />

        {/* Comparison Tool Input Section  */}
        <ComparisonInput />

        {/* Stats Section */}
        <StatsSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* How It Works Section */}
        <HowItWorks />
      </main>
    </div>
  );
};

export default Home;

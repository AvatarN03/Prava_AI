"use client";
import Image from "next/image";

import Hero from "@/components/Marketing/Hero";
import Features from "@/components/Marketing/Features";
import HTW from "@/components/Marketing/HTW";
import Pricing from "@/components/Marketing/Pricing";
import CTA from "@/components/Marketing/CTA";

const LandingPage = () => {
  return (
    <>
      

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Features />

      {/* How It Works Section */}
      <HTW />

      {/* pricing section  */}
      <section className="pricing 9-6 min-h-screen md:h-screen w-full bg-sidebar-accent/50 py-14 px-4 overflow-hidden">
        <div
          className="flex flex-col items-center justify-center h-full p-2 md:p-6 text-center max-w-7xl mx-auto relative"
          id="pricing"
        >
          <div className="hidden md:block absolute bg-blue-800 blur-[125px] -top-20 -left-10 w-120 h-96 z-0" />
          <div className="hidden md:block absolute bg-indigo-700 blur-[265px] top-1/3 -translate-y-1/2 right-10 w-150 h-150 z-0" />

          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 z-20">
            💸 Pricing Plans
          </h2>

          <p className="text-base tracking-widest text-gray-700 dark:text-gray-300 z-20">
            From inspiration to itinerary in minutes
          </p>

          <div className="flex gap-12 justify-center items-center flex-1 mt-6 w-full z-20 relative">
            <div className="hidden lg:block w-1/3">
              <Image
                src="/pricing.png"
                alt="pricing plans"
                width={800}
                height={800}
                className="xl:w-full h-full"
              />
            </div>

            <div className="flex gap-12 w-full lg:w-2/3 justify-center items-center">
              <Pricing />
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <CTA />

    </>
  );
};

export default LandingPage;

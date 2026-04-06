

import { Calendar, Clock, Compass, Crown, DollarSign, Map, Plane, Sparkles } from "lucide-react";

export const planSteps = [
  {
    step: "01",
    title: "Tell Us Your Dreams",
    description: "Share your destination, budget, interests, and travel dates",
    icon: Compass,
  },
  {
    step: "02",
    title: "AI Creates Magic",
    description: "Our AI analyzes millions of data points to craft your perfect itinerary",
   
    icon: Sparkles,
  },
  {
    step: "03",
    title: "Book & Enjoy",
    description: "Review, customize, and book your personalized travel plan",
 
    icon: Calendar,
  },
];

export const services = [
  {
    icon: Sparkles,
    title: "AI-Powered Planning",
    description: "Get personalized trip recommendations based on your preferences and budget",
    color: "blue",
  },
  {
    icon: Map,
    title: "Smart Discovery",
    description: "Explore destinations with interactive maps and local insights",
    
    color: "green",
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "Optimize your itinerary automatically with intelligent scheduling",
    
    color: "purple",
  },
  {
    icon: DollarSign,
    title: "Budget Tracking",
    description: "Track expenses and find the best deals in real-time",
    color: "purple",
  },
];

export const teamMembers = [
  {
    name: "Prashanth Naidu",
    image: "./naidu.jpg",
    linkedin: "https://www.linkedin.com/in/prashanth-naidu03/",
    github: "https://github.com/AvatarN03",
    email: "jsprashanth003@gmail.com",
  },
  {
    name: "Prathamesh Bhosale",
    image: "./Bhosale.png",
    linkedin: "https://www.linkedin.com/in/prathamesh--bhosale/",
    github: "https://github.com/PrathameshBhosale01",
    email: "bhosaleprathamesh202@gmail.com",
  },
  {
    name: "Harshad Shinde",
    image: "./shinde.jpeg",
    linkedin: "https://www.linkedin.com/in/harshad-shinde-3400harshh/",
    github: "https://github.com/harshh3400",
    email: "plshinde98@gmail.com",
  },
  {
    name: "Mohanish Patil",
    image: "./patil.jpeg",
    linkedin: "https://www.linkedin.com/in/mohanish-patil-b14a22295/",
    github: "https://github.com/mohanishhyphen",
    email: "mohanishpatil29@gmail.com",
  },
];

export const pricingPlans = [
  {
    title: "Free Plan",
    icon: Plane,
    tagline: "Explore Without Limits",
    description: "Perfect for casual travelers and students who want to plan trips effortlessly.",
    features: [
      "AI-generated trip plans for short trips",
      "Basic itinerary (places, timing, and route flow)",
      "Limited AI requests per day",
      "Access to public travel blogs & tips",
      "Save up to 7 trips",
      "Standard response speed",
    ],
    bestFor: "Trying out the platform, weekend trips, and first-time users",   
    price: "₹0",
  },
  {
    title: "Pro Plan",
    icon: Crown,
    tagline: "Travel Smarter with AI",
    description: "Built for frequent travelers who want deeper customization and control.",
    features: [
      "Unlimited AI-generated itineraries",
      "Smart activity & hotel recommendations",
      "Editable day-wise itinerary",
      "Export itinerary as PDF",
      "Priority AI responses",
      "Save unlimited trips",
      "Early access to new features",
    ],
    bestFor: "Frequent travelers, planners, and users who want a fully personalized trip experience",
    price: "Coming Soon",
  },
];

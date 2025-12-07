"use client";

import LoginButton from "../../components/LoginButton";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

// A simple star component
const Star = ({ style }: { style: React.CSSProperties }) => (
  <div className="absolute bg-white rounded-full" style={style}></div>
);

// Generate random stars
const getStars = (count: number) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const style = {
      width: `${Math.random() * 2 + 1}px`,
      height: `${Math.random() * 2 + 1}px`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animation: `float ${Math.random() * 10 + 5}s ease-in-out infinite`,
      animationDelay: `${Math.random() * 5}s`,
    };
    stars.push(<Star key={i} style={style} />);
  }
  return stars;
};

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [stars, setStars] = useState<React.ReactNode[]>([]);

  // Prevent hydration errors by generating stars only on client
  useEffect(() => {
    setIsHydrated(true);
    setStars(getStars(50));
  }, []);

  // Redirect to main app if user is authenticated
  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading || !isHydrated) {
    return null;
  }

  // Don't render anything if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
            opacity: 1;
          }
          50% {
            transform: translateY(-20px);
            opacity: 0.8;
          }
          100% {
            transform: translateY(0px);
            opacity: 1;
          }
        }
        .grass-blade {
          transition: transform 0.3s ease-in-out;
        }
        
        /* Translucent Glass Scrollbar for Landing Page */
        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          width: 12px;
        }
        
        html::-webkit-scrollbar-track,
        body::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 10px;
        }
        
        html::-webkit-scrollbar-thumb,
        body::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 10px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        html::-webkit-scrollbar-thumb:hover,
        body::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
        }
        
        /* Firefox scrollbar */
        html,
        body {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.1);
        }
      `}</style>
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white overflow-y-auto relative landing-page-scroll">
        {isHydrated && (
          <div className="absolute top-0 left-0 w-full h-full">{stars}</div>
        )}
        <div className="text-center p-8 max-w-md mx-auto z-10 flex flex-col justify-center flex-grow">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-24 h-24 mb-4">
              <Image
                src="/TaskJarLogo.png"
                alt="TaskJar Logo"
                width={96}
                height={96}
              />
            </div>
            <h1 className="text-5xl font-bold text-gray-100">TaskJar</h1>
          </div>
          <h2 className="text-6xl font-bold mb-4 text-green-300 leading-tight">
            STOP FORGETTING. <br /> START ACHIEVING.
          </h2>
          <p className="text-lg text-gray-400 mb-10">
            Your AI-powered command center for crushing every task, every day.
          </p>
          <div className="w-full">
            <LoginButton />
          </div>
          <div className="flex space-x-6 text-sm text-gray-400 relative z-10 mt-6">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
